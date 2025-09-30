import fs from 'fs';
import { Citizen, MunicipalPersonnel, Admin } from './model/user.js';

async function exportData() {
  try {
    // Export citizens
    const citizens = await Citizen.findAll({ raw: true });
    fs.writeFileSync('citizens.json', JSON.stringify(citizens, null, 2));

    // Export municipal personnel
    const municipalPersonnel = await MunicipalPersonnel.findAll({ raw: true });
    fs.writeFileSync('municipalPersonnel.json', JSON.stringify(municipalPersonnel, null, 2));

    // Export admins, minus super admins
    const admins = await Admin.findAll({ 
      where: { isSuperAdmin: false },
      raw: true
    });
    fs.writeFileSync('admins.json', JSON.stringify(admins, null, 2));

    console.log('JSON export complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

exportData();
