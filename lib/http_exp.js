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
		let access = this.structs[name] ;
		if(this.hasErrorItem(name)){
			access.push(item) ;
		}
		else{
			this.structs[name] = [] ;
			access = this.structs[name] ;
			access.push(item) ;
		}
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
	getErrorItemList : function(params){
		if(params && "object" == typeof params){
			return E2rorCodeDict._internaLErrorItemFinder.call(this,params) ;
		}
		return E2rorCodeDict._internaLErrorItemFinder.call(this) ;
	}
} ;

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
function HttpErrorFocus(id){ // 异常错误关注点进行重构  1 : N （条目分类）
	this.id            = id ;
	this.itemOfNames   = [] ;
	this.handleOfNames = [] ;
} ; 
HttpErrorFocus.prototype = {
	constructor : HttpErrorFocus ,
	getID : function(){
		return this.id ;
	} ,
	getItemName : function(name){
		if(!name){
			return this.itemOfNames ;
		}
		return this.findItemName(name) ;
	} ,
	addItemName : function(value){
		let _this = this ;
		if("string" == typeof value){
			if(this.hasItemName(value)){
				throw value + "已经存在" ;
			}
			this.itemOfNames.push(value) ;
		}
		else if(value && value.constructor === Array){
			value.forEach(function(v){
				_this.addItemName(v) ;
			}) ;
		}
		else{
			return ;
		}
	} ,
	hasItemName : function(name){
		return this.findItemName(name) ? true : false ;
	} ,
	findItemName : function(name){
		let finded = false ;
		if(!name){
			return this.getItemName() ;
		}
		this.itemOfNames.forEach(function(v){
			if(name == v){
				finded = true ;
				return false ;
			}
		}) ;
		return finded ? name : null ;
	} ,
	getHandleName : function(name){
		if(!name){
			return this.handleOfNames ;
		}
		return this.findHandleName(name) ;
	} ,
	addHandleName : function(value){
		let _this = this ;
		if("string" == typeof value){
			if(this.hasHandleName(value)){
				throw value + "已经存在" ;
			}
			this.handleOfNames.push(value) ;
		}
		else if(value && value.constructor === Array){
			value.forEach(function(v){
				_this.addHandleName(v) ;
			}) ;
		}
		else{
			return ;
		}
	} ,
	hasHandleName : function(name){
		return this.findHandleName(name) ? true : false ;
	} ,
	findHandleName : function(name){
		let finded = false ;
		if(!name){
			return this.getHandleName() ;
		}
		this.handleOfNames.forEach(function(v){
			if(name == v){
				finded = true ;
				return false ;
			}
		}) ;
		return finded ? name : null ;
	}
} ;

// 级别错误处理
function HttpThrowExector(httpException){
	this.handles = {} ;
	this.httpException = httpException ;
	this.cacheExecutor = {} ;
	this.initInternaL() ;
} ;
HttpThrowExector.prototype = {
	constructor : HttpThrowExector ,
	getCacheExecutor : function(){
		return this.cacheExecutor ;
	} ,
	throwHttpError : function(status_code,callback){
		let focuss = this.httpException.getRequestError().getErrorFocus() , _this = this , break_all = false ;
		for(let prop in focuss){
			let _focus = focuss[prop] 
			, focus_id = _focus.id
			, itemOfNames = _focus.itemOfNames
			, handleOfNames = _focus.handleOfNames ;
			itemOfNames.forEach(function(v){
				let error_codes = _this.httpException
				.getRequestError()
				.getErrorCodeDict()
				.getErrorItemByName(v) ;
				error_codes.forEach(function(code){
					if(status_code == code || code.code){
						break_all = true ;
						return false ;
					}
				}) ;
				if(break_all){
					_this.cacheExecutor = {
						handle_names  : handleOfNames ,
						response_data : {} // 返回的有意义的数据
					}  ;
					return false ;
				}
			}) ;
		}
		let handles = this.getHandles() ;
		this.cacheExecutor.handle_names.forEach(function(v){
			let run = handles[v] ;
			if(run && "function" == typeof run){
				run.call(_this,_this.cacheExecutor.response_data) ;
			}
		}) ;
	} ,
	initInternaL : function(){
		this.addExecuteHandle("default",function(data){ // 示意性质的操作
			console.log(data) ;
		}) ;
		this.addExecuteHandle("normal",function(data){
			console.log("异常错误写入文件！") ;
			console.log("异常错误屏幕输出！") ;
		}) ;
		this.addExecuteHandle("high",function(data){
			console.log('\x1B[36m%s\x1B[0m',"异常错误写入文件！");
			console.log('\x1B[36m%s\x1B[0m',"异常错误屏幕输出！");
			console.log('\x1B[36m%s\x1B[0m',"异常错误上报到服务端数据库！");
		}) ;
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
			this.handles[name] = handle ;
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
	addErrorFocus : function(focusID,itemOfNames,handleOfNames){
		if(this.hasErrorFocus(focusID)){
			throw "无效的" + focusID ;
		}
		let error_focus = new HttpErrorFocus(focusID) ;
		error_focus.addItemName(itemOfNames) ;
		error_focus.addHandleName(handleOfNames) ;
		this.errorsFocus[focusID] = error_focus ;
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
	init : function(){
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
function HttpException(){
	this.defined = {
		handles : []
	} ;
	this.hasDefinedItem   = false ;
	this.hasDefinedFocus  = false ;
	this.hasDefinedHandle = false ;
	this.requestError     = new RequestError() ;
	this.httpThrowExector = new HttpThrowExector(this) ;
	this.init() ;
} ;
HttpException.prototype = {
	constructor : HttpException ,
	getRequestError : function(){
		return this.requestError ;
	} ,
	init : function(){
		this.requestError.init() ;
	} ,
	getHttpCodeErrors : function(){
		return this.requestError.getErrorCodeDict().getErrorItemList() ;
	} ,
	getHttpFocusList : function(){
		return this.requestError.getErrorFocus() ;
	} ,
	defineHttpExecutorHandle : function(name,fn){ // 可添加多个同名的处理器
		this.httpThrowExector.addExecuteHandle(name,fn) ;
		this.defined.handles.push(name) ;
		this.hasDefinedHandle = true ;
		return this ;
	} ,
	defineHttpErrorItem : function(name,items){
		let _this = this ;
		items.forEach(function(v){
			_this.requestError.getErrorCodeDict().addErrorItemUsedDefined(name,v) ;
		}) ;
		this.hasDefinedItem = true ;
		return this ;
	} ,
	defineHttpErrorFocus : function(focusID,itemOfNames,handleOfNames){
		if("string" != typeof focusID){
			throw "focusID必须为string" ;
		}
		if(!itemOfNames || itemOfNames.constructor !== Array || !itemOfNames.length){
			throw "itemOfNames参数错误" ;
		}
		if(!this.hasDefinedItem){
			throw "未进行分类错误" ;
		}
		let hasHandleNames = false ;
		if(
			handleOfNames 
			&& handleOfNames.constructor === Array 
			&& handleOfNames.length 
			&& this.hasDefinedHandle
		){
			 hasHandleNames = true // 使用自定义处理句柄
		}
		this.requestError.addErrorFocus(focusID,itemOfNames,hasHandleNames ? handleOfNames : []) ; // 使用默认的处理句柄 [Default,Normal,High]
		this.hasDefinedFocus  = true ;
		return this ;
	} ,
	getDefinedErrorFocus : function(){
		return this.requestError.getErrorFocus() ;
	} ,
	catchHttpException : function(response_status_code,callback){
		if("string" != typeof response_status_code){
			throw "response_status_code参数错误" ;
		}
		if("function" != typeof callback){
			throw "callback参数错误" ;
		}
		let errorCode = this.requestError.getErrorCodeDict().getErrorItemList({
			key   : "code" ,
			value : response_status_code
		}) ;
		if(!errorCode){
			throw "错误的error_code" + response_status_code ;
		}
		if(!this.hasDefinedFocus){
			this.defineHttpErrorFocus(
				"client_server_all_focus",
				["http_normal_error","http_extra_error"],
				["default","normal","high"]
			) ;
		}
		this.httpThrowExector.throwHttpError(response_status_code,function(responseData){
			if(callback && "function" == typeof callback){
				return callback(responseData) ;
			}
		}) ;
		return this ;
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