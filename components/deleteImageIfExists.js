const fs = require("fs");
const path = require("path");

deleteImage = async function (filename) {
  fs.unlink(
    path.resolve(__dirname, "../public/images/" + filename),
    function (err) {
      if (err) throw new Error(err);
    }
  );
};

module.exports = { deleteImage };
