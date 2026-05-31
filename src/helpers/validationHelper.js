export const missingFields = (body, requiredFields) => {
  return requiredFields.filter(field => {
    return body[field] === undefined || body[field] === null || body[field] === '';
  });
};