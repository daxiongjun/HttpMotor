/*
 * @author Bigbear Wang. Ziyue
 */
 
/* a simple log module support */
 
function LogEntity(options){ // 日志信息实体模型
	this.name        = options.name          ;
	this.title       = options.title         ;
	this.content     = options.content       ;
	this.createdTime = new Date().toLocaleString() ;
	let name = this.name ;
	if(!name || "string" != typeof name){
		throw "name类型错误" ;
	}
} ;
LogEntity.prototype = {
	constructor :  LogEntity ,
	getName : function(){
		return this.name ;
	} ,
	getTitle : function(){
		return this.title ;
	} ,
	getContent : function(){
		return this.content ;
	} ,
	getCreatedTime : function(){
		return this.createdTime ;
	}
} ;
/* 日志内容过滤器 */
function LogMapFilter(){
	this.filters = {} ;
	this.initInternaLFilter() ;
} ;
LogMapFilter.prototype = {
	constructor : LogMapFilter ,
	addFilter :function(id,handle){
		if("function" != typeof handle){
			throw "handle参数错误" ;
		}
		if(this.hasFilter(id)){
			throw "已存在的ID" + id ;
		}
		this.filters[id]= handle ;
	} ,
	hasFilter :function(id){
		return this.filters[id] ? true : false ;
	} ,
	getFilter :function(id){
		if(id && "string" == typeof id){
			return this.filters[id] ;
		}
		return this.filters ;
	} ,
	filterLimit : function(data,hook){
		this[hook.type].call(this,data) ;
	} ,
	filterData : function(data,hook){
		this[hook.type].call(this,data) ;
	} ,
	initInternaLFilter : function(){
		let _this = this ;
		this.addFilter("Limit",function(data,hook){
			let ret_array = [] , count = 1 ;
			for(let prop in data){
				let item = data[prop] ;
				if(count <= hook.value){
					ret_array.push(item) ;
				}
				else{
					break ;
				}	
				count ++ ;
			}
			return ret_array ;
		}) ;
		this.addFilter("Data",function(data,hook){
			let ret_array = [] ;
			for(let prop in data){
				let record = data[prop] ;
				ret_array.push(record) ;
			}
			return ret_array ;
		}) ;
		let filters = this.getFilter() ;
		for(let prop in filters){
			let filter_call = filters[prop]
            , func_name = "filter" + prop ;
			this[func_name] = function(data,hook){
				return filters[hook.type].call(_this,data,hook) ;
			} ;
		}
	}
} ;
/* 日志管理器 */ 
function LogManager(){ 
	this.innerDefaultCategoryKey = "inner_default_category" ;
	this.logMap = {} ;
	this.logMap[this.innerDefaultCategoryKey] = {} ;
	this.logMapFilter = new LogMapFilter() ;
} ;

/* 内联内存模式日志匹配器 */
LogManager.InternaLLogMapFilter = function(logs,extra){
	
} ;
/* 内联内存模式日志查询器 */
LogManager.InnerLogManagerMapFinder = function(value,extra){ /* extra作为扩展钩子，目的是为了对检索的记录做额外的操作，例如排序，取若干条数据集 */
	function _InternaLFinder(logs,finder_kv){
		let logs_entity = logs 
		, log_array = [] 
		, k = finder_kv.key 
		, v = finder_kv.value
		, finded = false ;
		for(let prop in logs_entity){
			let entity = logs_entity[prop] ;
			if(entity[k]){
				if(!finder_kv.value){
					log_array.push(entity) ;
				}
				else{
					if(entity[k] == v){
						log_array.push(entity) ;
						finded = true ;
						return false ;
					}
				}
			}
		}
		if(finded){
			return log_array[0] ;
		}
		else{
			return [] ;
		}
		if(log_array.length){
			return log_array ;
		}
		return [] ;
	} ;
	if(!value && !extra){
		return this.logMap ;
	}
	if("string" == typeof value){
		if(extra && extra.key && extra.value){
			return _InternaLFinder(this.logMap[value],extra) ;
		}
		return this.logMap[value] ; 
	}
	else if(value && value.key && value.value){
		return _InternaLFinder(this.logMap,value) ;
	}
	return this.logMap ;
} ;
LogManager.prototype = {
	constructor : LogManager ,
	getInnerDefaultCategoryKey : function(){
		return this.innerDefaultCategoryKey ;
	} ,
	getLogMap : function(){
		return this.logMap ;
	} ,
	setCategory : function(name,value){
		if(!name || "string" != typeof name){
			throw "name参数错误" ;
		}
		let category_item = this.findCategory(name) ;
		if(!category_item){
			category_item = {} ;
			this.logMap[name] = category_item ;
		}
		else{
			category_item[value.name] = value ;
		}
	} ,
	findCategory : function(name){
		if(name){
			return LogManager.InnerLogManagerMapFinder.call(this,name) ;
		}
		return LogManager.InnerLogManagerMapFinder.call(this) ;
	} ,
	hasCategory : function(name){
		return  this.findCategory(name) ? true : false ;
	} ,
	getCategory : function(){
		return this.logMap ;
	} ,
	addLog : function(log,categoryName){
		if(!log || !categoryName){
			throw "参数错误" ;
		}
		this.setCategory(categoryName,log) ;
	} ,
	findLog : function(){
		let log_array = [] ;
		log_array.push(LogManager.InnerLogManagerMapFinder.call(this,"warn"))  ;
		log_array.push(LogManager.InnerLogManagerMapFinder.call(this,"log"))   ;
		log_array.push(LogManager.InnerLogManagerMapFinder.call(this,"error")) ;
		return log_array ;
	} ,
	hasLog : function(name){
		return LogManager.InnerLogManagerMapFinder.call(this,name) ;
	} ,
	findInternaL : function(value,extra){
		if("object" == typeof value){
			extra = value ;
			value = undefined
		}
		let finded_value = LogManager.InnerLogManagerMapFinder.call(this,value) , filter_array = null ;
		if(
			finded_value  
			&& "object" == typeof finded_value
			&& "object" == typeof extra
		){
			let filterExecuter = this.logMapFilter["filter" + extra.type] ;
			filter_array = filterExecuter.call(this,finded_value,extra) ;
		}
		return filter_array ;
	}
} ;

function MemoryInternaLProcessor(){ // 内存级别的日志处理器
	this.registed = {
		"log" : {
			color  : "\x1B[36m%s\x1B[0m" ,
			format : "csv"
		} ,
		"warn" : {
			color : "\x1B[36m%s\x1B[0m" ,
			format : "csv"
		} ,
		"info" : {
			color : "\x1B[36m%s\x1B[0m" ,
			format : "json"
		} ,
		"error" : {
			color : "\x1B[36m%s\x1B[0m" ,
			format : "json"
		}
	} ;
	this.logManager = new LogManager() ;
	this.initInternaL() ;
} ;
MemoryInternaLProcessor.prototype = {
	constructor : MemoryInternaLProcessor ,
	write : function(log,options){
		let format = new LogFormat() 
		, log_instance = new LogEntity(log) 
		,  _option = this.registed[options.type]
        , log_info = {
			name        : log_instance.getName()      ,
			title       : log_instance.getTitle()     ,
			content     : log_instance.getContent()   ,
			createdTime : log_instance.getCreatedTime()
		} ;
		console.log(_option.color,(format[options.format])(log_info)) ;
		this.logManager.addLog(log_info,options.type) ;
	} ,
	getLog: function(){
		return this.logManager.findLog() ;
	} ,
	getLogManager : function(){
		return this.logManager ;
	} ,
	initInternaL : function(){
		let _this = this ;
		["error","warn","log","info"].forEach(function(key){
			_this[key] = function(log){
				_this.write(log,key) ;
			} ;
			_this.logManager.setCategory(key) ;
		}) ;
	}
} ;

/* 文件级别日志存储器 */
function FileInternaLProcessor(){
	
} ;
FileInternaLProcessor.prototype = {
	constructor : FileInternaLProcessor
} ;

function LogFormat(){ // 日志格式化工具类
	this.innerRule = [
		",","_","-","|","#",
		"*","$","!","&","%",
		"^","+","=","@","?",
		"/","//"
	] ;
	this.handles = {} ;
	this.initInternaLHandle() ;
} ;
LogFormat.prototype = {
	constructor : LogFormat ,
	addFormatHandle : function(name,handle){
		if(this.hasFormatHandle(name)){
			throw "已存在的name" + name ;
		}
		if(!handle || "function" != typeof handle){
			throw "handle参数错误" ;
		}
		this.handles[name] = handle ;
	} ,
	hasFormatHandle : function(name){
		return this.handles[name] ? true : false ;
	} ,
	getFormatHandle : function(name){
		if(name && "string" == typeof name){
			return this.handles[name] ;
		}
		return this.handles ;
	} ,
	initInternaLHandle : function(){
		this.addFormatHandle("json",function(data){
			let s = "" ;
			for(let prop in data){
				let v = data[prop] + "\n" ;
				s += v ;
			}
			return s ;
		}) ;
	} ,
	table : function(){
		
	} ,
	json : function(data){
		let handle = this.getFormatHandle("json") ;
		if(handle){
			return handle.call(this,data) ;
		}
		else{
			return "" ;
		}
	} ,
	csv : function(content,split_flag){
		let rules = this.innerRule , hasRule = false , log_array = [] ;
		if(content && "object" == typeof content){
			for(let prop in content){
				log_array.push(content[prop]) ;
			}
			content = log_array ;
		}
		else if(
			content 
			&& content.constructor === Array 
			&& content.length
		){
			
		}
		else{
			throw "content参数错误" ;
		}
		if(split_flag && "string" == typeof split_flag){
			rules.forEach(function(rule){
				if(split_flag == rule){
					hasRule = true ;
					return false ;
				}
			}) ;
			if(hasRule){
				return content.join(split_flag) ;
			}
			else{
				return content.join(",") + "\n" ;
			}
		}
		else{
			return content.join(",") + "\n" ;
		}
	}
} ;

function Log4Njs(options){
	this.mode = "" ;
	this.internaLProcessor = new MemoryInternaLProcessor() ;
	this.init() ;
} ;
Log4Njs.prototype = {
	constructor : Log4Njs ,
	init : function(){
		let _this = this ;
		this.log({
			name    : "Lurker-v-1.0" ,
			title   : "Lurker log" ,
			content : "Lurker"
		}) ;
		setTimeout(function(){
			let v = _this.internaLProcessor.getLogManager().findInternaL({
				type  : "Data" ,
				value :  "as"
			}) ;
			console.log(v)
		},17) ;
	} ,
	log : function(log){
		this.internaLProcessor.write(log,{
			type   : "log" ,
			format : "json"
		}) ;
	} ,
	error : function(log){
		this.internaLProcessor.write(log,{
			type   : "error" ,
			format : "json"
		}) ;
	} ,
	warn : function(log){
		this.internaLProcessor.write(log,{
			type   : "warn" ,
			format : "json"
		}) ;
	} ,
	info : function(log){
		this.internaLProcessor.write(log,{
			type   : "info" ,
			format : "csv"
		}) ;
	}
} ;
Log4Njs.create = function(options){
	return new Log4Njs({}) ;
} ;

// export api
module.exports = Lurker = Log4Njs ;