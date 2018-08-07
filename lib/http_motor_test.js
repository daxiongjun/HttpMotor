const HttpException = require("./http_exp") ;

/* api test */
let httpExp = new HttpException()
httpExp.defineWarningError("bigbear",["404","500"]) ;
console.log(httpExp.getWarningErrors())
