import Bree from "bree";

const bree = new Bree({
    root: '../routes/SeederAdmin',
    jobs: [
        {
            name: 'SendEmailJob',
            path: false,
        },
        {
        name: 'SendPasswordResetJob',
        path: false
        }
    ]
});

export default bree;