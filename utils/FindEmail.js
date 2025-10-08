import { Citizen,Admin,MunicipalPersonnel } from "../model/user.js";

export async function isEmailTaken(email) {

    //check if each user exists 
    const adminExists = await Admin.findOne({where: {email}});
    if(adminExists) return true;

    const citizenExists = await Citizen.findOne({where: {email}});
    if(citizenExists) return true;
    
    const municipalExists = await MunicipalPersonnel.findOne({where: {email}});
    if(municipalExists) return true;
}