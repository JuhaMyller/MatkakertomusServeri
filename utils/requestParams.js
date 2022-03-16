const reqParams = ({ ...params }, req) => {
  let haveParams = false;
  for (const param in params) {
    haveParams = false;
    for (const reqParams in req) {
      if (param === reqParams) {
        haveParams = true;
      }
    }
    if (!haveParams) {
      return false;
    }
  }
  return true;
};

module.exports = reqParams;
