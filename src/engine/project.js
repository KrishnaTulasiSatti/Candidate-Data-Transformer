const _ = require('lodash');
const { normalizePhone } = require('../normalizers/phone');
const { normalizeDate } = require('../normalizers/date');

function applyProjection(canonicalProfile, config) {

  const result = {};
  
  for (const fieldDef of config.fields) {
    
    const sourcePath = fieldDef.from || fieldDef.path;
  
    let value = _.get(canonicalProfile, sourcePath);
    

    if (value != null && fieldDef.normalize) {
     
      if (fieldDef.normalize === 'E164') {
      
        value = normalizePhone(value);

      } else if (fieldDef.normalize === 'E164_array') {
       
        value = Array.isArray(value) ? value.map(p => normalizePhone(p)) : value;

      } else if (fieldDef.normalize === 'YYYY-MM') {

        value = normalizeDate(value);
      }
    }
    
   
    if (value == null || (Array.isArray(value) && value.length === 0)) {
   
      if (fieldDef.required || config.on_missing === 'error') {
       
        throw new Error(`Required field missing: ${fieldDef.path}`);
   
      } else if (config.on_missing === 'omit') {
        
        continue;
 
      } else {
      
        value = null;
      }
    }
    
 
    result[fieldDef.path] = value;
  }
  
  
  if (config.include_provenance) {

    result.provenance = canonicalProfile.provenance;
  }
  

  return result;
}


module.exports = { applyProjection };
