const fs = require("fs");
const path = require("path");

module.exports.deleteImageIfExists = async function (doc) {
  if (doc.filename) {
    fs.unlink(
      path.resolve(__dirname, "../public/images/" + doc.filename),
      function (err) {
        if (err) throw new Error(err);
      }
    );
  }
};
