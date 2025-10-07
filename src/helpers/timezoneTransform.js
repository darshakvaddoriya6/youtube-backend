import moment from "moment-timezone";

/**
 * Transforms Mongoose document timestamps to IST format
 * @param {Object} doc - Mongoose document
 * @param {Object} ret - JSON representation of the document
 * @returns {Object} - Modified JSON object with IST formatted timestamps
 */
export const timezoneTransform = function (doc, ret) {
  if (ret.createdAt) {
    ret.createdAt = moment(ret.createdAt)
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
  }
  if (ret.updatedAt) {
    ret.updatedAt = moment(ret.updatedAt)
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
  }
  return ret;
};
