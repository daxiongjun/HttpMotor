/*
 * @author Bigbear Wang. Ziyue
 */
/* Global Register Error Codes */

// 常规异常
const http_normal_errors = [
	{
		code : "400" ,
		message : "请求错误，服务器不理解请求的语法"
	} ,
	{
		code : "404" ,
		message : "找不到请求的网页" 
	} ,
	{
		code : "500" ,
		message : "服务器遇到错误，无法完成请求"
	} ,
	{
		code : "501" ,
		message : "服务器不具备完成请求的功能"
	} ,
	{
		code : "502" ,
		message : "服务器作为网关或代理，从上游服务器收到无效响应"
	} ,
	{
		code : "503" ,
		message : "服务器目前无法使用，由于超载或停机维护。通常，这只是暂时状态"
	}
] ;

// 业务级别的异常代码
const http_extra_errors = [
	{
		code : "0x4487" ,
		message : "无效的转帐通知"
	} ,
	{
		code : "0x9923" ,
		message : "下发订单发生错误"
	}
] ;

function E2rorCodeDict(){ // 错误码字典
	this.structs = {
		"http_normal_error" : [] ,
		"http_extra_error"  : []
	} ;
	this.usedDefaultAccess = "" ;
} ;
E2rorCodeDict._internaLErrorItemFinder = function(name,extra){
	let structs = this.structs , finded = null ;
	if(!name && !extra){
		return this.structs ;
	}
	if(name && "string" == typeof name){
		if(extra && "object" == typeof extra){
			let struct = structs[name] , k = extra.key , v = extra.value ; 
			struct.forEach(function(value){
				let errorRecord = value[k] ;
				if(errorRecord &&  errorRecord == v){
					finded = errorRecord ;
					return false ;
				}
			}) ;
			return finded ;
		}
		else{
			return structs[name] || finded ;
		}
	}
	if("object" == typeof name){
		let k = name.key , v = name.value , break_all = false ;
		for(let prop in structs){
			let tmp = structs[prop] ;
			tmp.forEach(function(_value){
				let _record = _value[k] ;
				if(_record && _record == v){
					finded = _record ;
					break_all = true ;
					return false ;
				}
			}) ;
			if(break_all){
				break ;
			}
		}
		return finded ;
	}
	return finded ;
} ;
E2rorCodeDict.prototype = {
	constructor : E2rorCodeDict ,
	getUsedDefaultAccessInfo : function(flag){
		if(flag){
			return {
				type    : this.usedDefaultAccess ,
				message : "http_normal_error" == this.usedDefaultAccess ? "网络异常错误存储" : "业务异常错误存储"
			}
		}
		return this.usedDefaultAccess ;
	} ,
	addErrorItemUsedNormaL : function(item){
		this.usedDefaultAccess += "http_normal_error" ;
		let access = this.structs.http_normal_error ;
		access.push(item) ;
	} ,
	addErrorItemUsedExtra : function(item){
		this.usedDefaultAccess += "http_extra_error" ;
		let access = this.structs.http_extra_error ;
		access.push(item) ;
	} ,
	addErrorItemUsedDefined : function(name,item){
		if(this.hasErrorItem(name)){
			throw "已经存在的分类" + name ;
		}
		let access = this.structs[name] = [] ;
		access.push(item) ;
	} ,
	hasErrorItem : function(name){
		return this.structs[name] ? true : false ;
	} ,
	getErrorItemByName : function(name){
		return E2rorCodeDict._internaLErrorItemFinder.call(this,name) ;
	} ,
	getErrorItemByParams : function(name,params){
		return E2rorCodeDict._internaLErrorItemFinder.call(this,name,params) ;
	} ,
	getErrorItemList : function(name,params){
		return E2rorCodeDict._internaLErrorItemFinder.call(this) ;
	}
} ;

/* 以上是新增代码 @date 2018/8/9 */

function ErrorCode(error){ // 进行了简化，现在就是一个Entity
	this.code    = error.code ;
	this.message = error.message ;
} ;
ErrorCode.prototype = {
	constructor : ErrorCode ,
	getCode : function(){
		return this.code ;
	} ,
	getMessage : function(){
		return this.message ;
	} ,
	getInfo : function(){
		return {
			code    : this.code ,
			message : this.message
		} ;
	}
} ;

// 错误关注点处理 
function ErrorFocus(id){
	this.id = id ;
	this.errors = []
} ;
ErrorFocus.prototype = {
	constructor : ErrorFocus ,
	getID : function(){
		return this.id ;
	} ,
	getError : function(name){
		if(!name){
			return this.errors ;
		}
		return this.findError(name) ;
	} ,
	addError : function(error){
		if(this.hasError(error)){
			throw error + "已经存在" ;
		}
		this.errors.push(error) ;
	} ,
	hasError : function(error){
		return this.findError(error) ? true : false ;
	} ,
	findError : function(name){
		let finded = false ;
		if(!name){
			return this.getError() ;
		}
		this.errors.forEach(function(v){
			if(name == v){
				finded = true ;
				return false ;
			}
		}) ;
		return finded ? name : null ;
	} ,
	getInfo : function(name){
		let retInfo = { 
			id : this.getID() ,
			focusInfo : {}
		} ;
		if(name){
			let error = this.findError(name) ;
			let codes = this.requestError.getErrorCodes() ;
			retInfo["focusInfo"] = codes[error] ;
		}
		else{
			(this.getError()).forEach(function(v){
				retInfo["focusInfo"][v.getCode()] = v.getInfo(true) ;
			}) ;
		}
		return retInfo ;
	}
} ;
function ErrorLeveL(id,options){
	this.id   = id ;
	this.name = options.name ;
	this.desc = options.desc ;
	this.type = options.type || "default" ;
	this.errorFocus = null ;
} ;
ErrorLeveL.prototype = {
	constructor : ErrorLeveL ,
	getID : function(){
		return this.id ;
	} ,
	getName : function(){
		return this.name ;
	} ,
	getType : function(){
		return this.type ;
	} ,
	getDesc : function(){
		return this.desc ;
	} ,
	setErrorFocus : function(errorFocus){
		this.errorFocus = errorFocus ;
	} ,
	getErrorFocus : function(){
		return this.errorFocus ;
	}
} ;
// 级别错误处理
function HttpThrowExector(){
	this.leves = {} ;
	this.handles = {} ;
} ;
HttpThrowExector.InternalHandle = { // 示意性质的操作
	"default" : function(data){
		console.log(data) ;
	} ,
	"normal" : function(data){
		console.log("异常错误写入文件！") ;
		console.log("异常错误屏幕输出！") ;
	} ,
	"high" : function(data){ 
		console.log('\x1B[36m%s\x1B[0m',"异常错误写入文件！");
		console.log('\x1B[36m%s\x1B[0m',"异常错误屏幕输出！");
		console.log('\x1B[36m%s\x1B[0m',"异常错误上报到服务端数据库！");
	}
} ;
HttpThrowExector.prototype = {
	constructor : HttpThrowExector ,
	addLeveL : function(Lv){
		let LID = Lv.getID() ;
		if(this.hasLeveL(LID)){
			throw "id" + LID + "已经存在" ;
		}
		this.leves[LID] = Lv ;
	} ,
	hasLeveL : function(id){
		return this.leves[id] ? true : false ;
	} ,
	getLeveL : function(id){
		if(!id){
			return this.leves ;
		}
		return this.leves[id] ;
	} ,
	throwHttpError : function(statusCode,callback){
		let Lvs = this.getLeveL() , httpThrowExexHandle = HttpThrowExector.InternalHandle , tmp = null ;
		for(let prop in Lvs){
			let LV = Lvs[prop] ;
			let responseData = {
				LID  : LV.getID()   ,
				name : LV.getName() ,
				type : LV.getType() ,
				desc : LV.getDesc() ,
				focusID : LV.getErrorFocus().getID() ,
				errorCodes : LV.getErrorFocus().getError()
			} ;
			let codes = responseData.errorCodes ;
			codes.forEach(function(v){
				if(statusCode == v){
					tmp = responseData ;
					return false ;
				}
			}) ;
			if(tmp){
				break ;
			}
		}
		httpThrowExexHandle[tmp.type].call(httpThrowExexHandle,tmp) ;
		callback && callback(tmp) ;
	} ,
	addExecuteHandle : function(name,handle){ // 新增异常句柄处理
		if("function" != typeof handle){
			throw "无效的参数：" + handle ;
		}
		let handle_array = this.handles[name] ;
		if(this.hasExecuteHandle(name)){
			handle_array.push(handle) ;
		}
		else{
			handle_array = this.handles[name] = [] ;
			handle_array.push(handle) ;
			this.handles[name] = handle_array ;
		}
	} ,
	hasExecuteHandle : function(name){
		return this.handles[name] ? true : false ;
	} ,
	getHandles : function(){
		return this.handles ;
	}
} ;
function RequestError(){
	this.errorsFocus = {} ;
	this.ECDict = new E2rorCodeDict() ;
} ;
RequestError.prototype = {
	constructor : RequestError ,
	getErrorCodeDict : function(){
		return this.ECDict ;
	} ,
	addErrorFocus : function(focusID,codes){
		if(this.hasErrorFocus(focusID)){
			throw "无效的" + focusID ;
		}
		let eFocus = new ErrorFocus(focusID) ;
		for(let prop in codes){
			let code = codes[prop] ;
			eFocus.addError(code) ;
		}
		this.errorsFocus[focusID] = eFocus ;
	} ,
	hasErrorFocus : function(fid){
		return this.errorsFocus[fid] ? true : false ;
	} ,
	getErrorFocus : function(fid){
		if(!fid){
			return this.errorsFocus ;
		}
		return this.errorsFocus[fid] ;
	} ,
	_init : function(){
		this.initDefaultErrorCodeItems(true) ;
		this.initDefaultErrorCodeItems() ;
	} ,
	initDefaultErrorCodeItems : function(usedNormaL){
		let data = null , fn = null , _this  = this ; 
		if(usedNormaL){
			data = http_normal_errors ;
			fn = this.ECDict.addErrorItemUsedNormaL ;
		}
		else{
			data = http_extra_errors ;
			fn = this.ECDict.addErrorItemUsedExtra ;
		}
		data.forEach(function(val){
			fn.call(_this.ECDict,new ErrorCode(val)) ;
		}) ;
	}
} ;
function HttpException(options){
	this.definedFocusError = "" ;
	this.hasDefinedErrorFocus = false ;
	this.requestError = new RequestError() ;
	this.httpThrowExector = new HttpThrowExector() ;
	this.init() ;
	this.httpThrowExector.addExecuteHandle("aaa",function(){console.log(122222)}) ;
} ;
HttpException.prototype = {
	constructor : HttpException ,
	getRequestError : function(){
		return this.requestError ;
	} ,
	init : function(){
		this.requestError._init() ;
		this.requestError.addErrorFocus("client",["400","404"]) ;
		this.requestError.addErrorFocus("server",[
			"500","501",
			"502","503"
		]) ;
	} ,
	getHttpCodeErrors : function(){
		return this.requestError.getErrorCodeDict().getErrorItemList() ;
	} ,
	useALLErrorFocus : function(){
		if(this.hasDefinedErrorFocus) return ;
		this.defineErrorFocus("all",[
			"400","404",
			"500","501",
			"502","503" 
		],{
			name : LeveL.name || "all" ,
			desc : LeveL.desc || "all" ,
			type : LeveL.type || "default"
		}) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	useClientErrorFocus : function(){
		if(this.hasDefinedErrorFocus) return ;
		this.defineErrorFocus("client",["400","404"],{
			name : LeveL.name || "client" ,
			desc : LeveL.desc || "client" ,
			type : LeveL.type || "high"
		}) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	useServerErrorFocus : function(){
		if(this.hasDefinedErrorFocus) return ;
		this.defineErrorFocus("server",[
			"500","501",
			"502","503"
		] ,{
			name : LeveL.name || "server" ,
			desc : LeveL.desc || "server" ,
			type : LeveL.type || "normal"
		}) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	defineErrorFocus : function(name,codes,LeveL){
		if(this.hasDefinedErrorFocus) return ;
		let _this = this ;
		codes.forEach(function(v){
			let code = _this.requestError.getErrorCodeDict().getErrorItemByParams({
				key   : "code" ,
				value : v
			}) ;
			if(!code){
				throw "无效的" + v ;
			}
		}) ;
		this.requestError.addErrorFocus(name,codes) ;
		let errorLeveL = new ErrorLeveL(LeveL.id || ("Lv_ID_" + new Date().getTime()),{
			name : LeveL.name || "" ,
			desc : LeveL.desc || "" ,
			type : LeveL.type || "default"
		}) ;
		errorLeveL.setErrorFocus(this.requestError.getErrorFocus(name)) ;
		this.definedFocusError += name ;
		this.httpThrowExector.addLeveL(errorLeveL) ;
		this.hasDefinedErrorFocus = true ;
	} ,
	getDefinedErrorFocus : function(){
		return this.requestError.getErrorFocus() ;
	} ,
	catchHttpException : function(responseStatusCode,callback){
		let _focus = null , statusCode = responseStatusCode + "" ;
		let c = null ;
		if(!this.hasDefinedErrorFocus){
			this.useALLErrorFocus() ; // 默认构建全部错误状态的异常关注
		}
		_focus = this.requestError.getErrorFocus(this.definedFocusError) ;	
		_focus.errors.forEach(function(v,k){
			if(statusCode == v){
				c = v ;
				return false ;
			}
		}) ;
		if(!c){
			let flashErrorFocus = [] ;
			flashErrorFocus.push(statusCode) ;
			this.defineErrorFocus("flash_focus",flashErrorFocus,{
				name : "flash" ,
				desc : "flash" ,
				type : "default"	
			}) ; // 创建临时异常关注点
		}
		this.httpThrowExector.throwHttpError(statusCode,function(responseData){
			if(callback && "function" == typeof callback){
				return callback(responseData) ;
			}
		}) ;
	} ,
	_writeLog : function(info){ // 这里的代码就是一个示意，实际可能会加入本地存储写入日志或者别的操作
		let s = "" ;
		for(let prop in info){
			let v = info[prop] ;
			s += v + "\n" ;
		}
		console.log('\x1B[36m%s\x1B[0m',s) ;
	}
} ;

// export api
module.exports = HttpException ;