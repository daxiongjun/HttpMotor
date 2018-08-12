const Lurker = require("./log4_njs") ;

let lurker = Lurker.create({}) ;
lurker.warn({
	name    : "Log4Njs" ,
	title   : "Log4Njs log" ,
	content : "Log4Njs-v-1.0"
}) ;
lurker.info({
	name    : "fuck android" ,
	title   : "fuck log" ,
	content : "fuckfuckfuckfuckfuck"
}) ;
lurker.log({
	name    : "aasaasas" ,
	title   : "asasasas log" ,
	content : "asasas212111112"
}) ;
lurker.error({
	name    : "异常错误" ,
	title   : "error log" ,
	content : "异常错误21121211"
}) ;