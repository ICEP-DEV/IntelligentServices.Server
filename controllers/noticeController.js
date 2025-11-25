import GeneralNotice from '../model/generalNotice.js';
import ImageNotice from '../model/imageNotice.js';
import { sequelize } from '../config/dbconfig.js';
import { getSocket } from '../config/socket.js';

/**
 * Fetches all general and image notices for public display.
 */
export const getNotices = async (req, res) => {
  try {
    const generalNotices = await GeneralNotice.findAll({ order: [['display_order', 'ASC']] });
    const imageNoticesData = await ImageNotice.findAll({
      attributes: ['id', 'description', 'display_order', 'image_data', 'mime_type'],
      order: [['display_order', 'ASC']],
    });

    // Construct a Data URL for each image source.
    const imageNotices = imageNoticesData.map(notice => ({
      id: notice.id,
      description: notice.description,
      // Convert the binary data (Buffer) to a Base64 string and create a Data URL.
      src: `data:${notice.mime_type};base64,${notice.image_data.toString('base64')}`,
    }));

    res.status(200).json({ generalNotices, imageNotices });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch notices." });
  }
};

/**
 * Serves a single image notice by its ID.
 * This endpoint is what the <img> src attribute will point to.
 */
export const getImageNoticeById = async (req, res) => {
  try {
    const notice = await ImageNotice.findByPk(req.params.id);
    if (!notice) {
      return res.status(404).send('Image not found.');
    }
    // Set the correct content type header.
    res.setHeader('Content-Type', notice.mime_type);
    // Send the binary image data.
    res.send(notice.image_data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send('Error fetching image.');
  }
};

/**
 * (Super Admin) Updates all notices. This is a transactional operation.
 */
export const updateNotices = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const generalNotices = JSON.parse(req.body.generalNotices);
    const imageDescriptions = JSON.parse(req.body.imageDescriptions);
    const images = req.files;
    if (generalNotices && generalNotices.length > 0) {
      const noticesToCreate = generalNotices.map((notice, index) => ({
        notice_text: notice.notice,
        display_date: notice.date,
        region: notice.region,
        display_order: index,
      }));
      await GeneralNotice.bulkCreate(noticesToCreate, { transaction: t });
    }
    if (images && images.length > 0) {
      let fileIndex = 0;
      const imageNoticesToCreate = [];

      for (let i = 0; i < imageDescriptions.length; i++) {
        const description = imageDescriptions[i];
        if (images && fileIndex < images.length) {
            const image = images[fileIndex];
            imageNoticesToCreate.push({
                description: description,
                image_data: image.buffer,
                mime_type: image.mimetype,
                display_order: i,
            });
            fileIndex++;
        }
      }

      if (imageNoticesToCreate.length > 0) {
        await ImageNotice.bulkCreate(imageNoticesToCreate, { transaction: t });
      }
    }
    await t.commit();

    // Fetch the newly created data to send back for WebSocket broadcast.
    const updatedGeneralNotices = await GeneralNotice.findAll({ order: [['display_order', 'ASC']] });
    const updatedImageNoticesData = await ImageNotice.findAll({
      attributes: ['id', 'description', 'display_order', 'image_data', 'mime_type'],
      order: [['display_order', 'ASC']],
    });
    const updatedImageNotices = updatedImageNoticesData.map(notice => ({
      id: notice.id,
      description: notice.description,
      src: `data:${notice.mime_type};base64,${notice.image_data.toString('base64')}`,
    }));

    const updatedNotices = {
      generalNotices: updatedGeneralNotices,
      imageNotices: updatedImageNotices,
    };
    const io = getSocket();
    io.emit("noticeBoardUpdated", updatedNotices);
    res.status(200).json({
      message: "Notice board updated successfully!",
      updatedNotices,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating notices:", error);
    res.status(500).json({ error: "Failed to update notice board." });
  }
};