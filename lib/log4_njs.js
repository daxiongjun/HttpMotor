/*
 * @author Bigbear Wang. Ziyue
 */
 
const fs = require("fs")
, util = require("util")
, events = require("events")
//, request = require("request") ;

/* Lurker version 1.0 */
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
/* 内存级别的日志存储器 */
function MemoryInternaLProcessor(){  
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

/* 新增的控制台日志处理器 */
function ConsoleInternaLProcessor(){
	this.handleTable = {} ;
	this.initInternaL()   ;
} ;
ConsoleInternaLProcessor._default = {
	styles : {
		"green"    :['\x1B[32m', '\x1B[39m'] ,
		"inverse" : ['\x1B[7m' ,'\x1B[27m']  ,
		"cyan"    : ['\x1B[36m','\x1B[39m']  ,
		"red"     : ['\x1B[31m','\x1B[39m']
	}
} ;
ConsoleInternaLProcessor.prototype = {
	constructor : ConsoleInternaLProcessor ,
	addHandle : function(id,handle){
		let hd = this.handleTable[id] ;
		if(hd){
			throw "已存在的" + id ;
		}
		this.handleTable[id] = handle ;
	} ,
	use : function(id,options,handle){
		let _this = this ;
		this.addHandle(id,handle) ;
		this[id] = function(info){
			_this.write(info,{
				color  : options.color || "cyan" , 
				inline : !!options.inline
			},id) ;
		} ;
	} ,
	write : function(info,options,type){
		let log = {
			content : info ,
			date    : new Date().toLocaleString() 
		} 
		, handle = this.handleTable[type] ;
		if(handle && "function" == typeof handle){
			let output = handle.call(this,log,options) 
			, color = ConsoleInternaLProcessor._default.styles[options.color][0]  ;
			console.log(color,output) ;
		}
		else{
			throw "无效的处理句柄" ;
		}
	} ,
	log : function(info){
		this.write(info,{
			color  : "cyan" ,
			inline : true
		},"log") ;
	} ,
	warn : function(info){
		this.write(info,{
			color  : "cyan" ,
			inline : true
		},"warn") ;
	} ,
	info : function(info){
		this.write(info,{
			color  : "inverse" ,
			inline : false
		},"info") ;
	} ,
	error : function(info){
		this.write(info,{
			color  : "red" ,
			inline : false
		},"error") ;
	} ,
	initInternaL : function(){
		this.addHandle("log",function(log,options){
			let out_ln = "" , s = "" ;
			if("boolean" == typeof options.inline && !options.inline){
				out_ln += "\n"
			}
			s += out_ln ? ("<" + log.date + ">" + out_ln + log.content) : ("[" + log.date + "]" + " " + "<LOG::>" + " " + log.content + out_ln) ;
			return s ;
		}) ;
		this.addHandle("warn",function(log,options){
			let out_ln = "" , s = "" ;
			if("boolean" == typeof options.inline && !options.inline){
				out_ln += "\n"
			}
			s += out_ln ? ("<" + log.date + ">" + out_ln + log.content) : ("|" + log.date + "|" + " " + "<WARN::>" + " " + log.content + out_ln) ;
			return s ; 
		}) ;
		this.addHandle("info",function(log,options){
			let out_ln = "" , s = "" ;
			if("boolean" == typeof options.inline && !options.inline){
				out_ln += "\n"
			}
			s += out_ln ? ("<" + log.date + ">" + out_ln + log.content) : ("<" + log.date + ">" + " " + "<INFO::>" + " " + log.content + out_ln) ;
			return s ; 
		}) ;
		this.addHandle("error",function(log,options){
			let out_ln = "" , s = "" ;
			if("boolean" == typeof options.inline && !options.inline){
				out_ln += "\n"
			}
			s += out_ln ? ("[" + log.date + "]" + out_ln + log.content) : ("<" + log.date + ">" + " " + "<ERROR::>" + " " + log.content + out_ln) ;
			return s ; 
		}) ;
	}
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

/* 日志资源查询器 */
function LogResourceQuery(){
	events.EventEmitter.call(this) ;
} ;
util.inherits(LogResourceQuery,events.EventEmitter) ;

/* 文件级别日志存储器 */
function FileInternaLProcessor(options){
	this.docBase = options.docBase || "sys_default_klog" ;
	this.klog = "sys_default_file" ;
	this.logFileAccessor = new LogFileAccessor({}) ;
	this.init() ;
} ;
FileInternaLProcessor.prototype = {
	constructor : FileInternaLProcessor ,
	init : function(){
		let _this = this ;
		this.logFileAccessor.createDocument({
			name : this.docBase
		})
		.then(function(){}) ;
	} ,
	setKLog : function(klog){
		this.klog = klog ;
	} ,
	write : function(log){
		if("object" != typeof log){
			throw "log参数错误" ;
		}
		this.logFileAccessor.createFile(this.klog,this.docBase,log) ;
	}
} ;

/* 日志档案Entity */
function LogFileEntity(options){
	this.name = options.name ;
	this.size = -1 ;
	this.type = options.type || "1" ; // 1,readonly 2,write
	this.contents = [] ;
	this.createdTime = new Date().toLocaleString() ;
} ;
LogFileEntity.prototype = {
	constructor : LogFileEntity ,
	getName : function(){
		return this.name ;
	} ,
	getSize : function(){
		return this.size ;
	} ,
	getType : function(){
		return this.type ;
	} ,
	getCreatedTime : function(){
		return this.createdTime ;
	} ,
	getContents : function(){
		return this.contents ;
	}
} ;

/* 日志文档Entity */
function LogDocument(options){
	this.name        = options.name ;
	this.size        = -1 ;
	this.type        = options.type || "1" ; // 1,readonly 2,write
	this.createdTime = new Date().toLocaleString() ;
	this.files = [] ;
} ;
LogDocument.prototype = {
	constructor : LogDocument ,
	getName : function(){
		return this.name ;
	} ,
	getSize : function(){
		return this.size ;
	} ,
	getType : function(){
		return this.type ;
	} ,
	getCreatedTime : function(){
		return this.createdTime ;
	} ,
	addFile : function(name,file){
		if(this.hasFile(name)){
			throw "已存在的文件名" +  name ;
		}
		this.files.push(file) ;
	} ,
	hasFile : function(name){
		return this.files[name] ? true : false ;
	} ,
	getFile : function(name){
		let file_entity = null ;
		if(name && "string" == typeof name){
			this.files.forEach(function(file){
				if(file.name == name){
					file_entity = file ;
					return false ;
				}
			}) ;
			return file_entity ;
		}
		return this.files ;
	}
} ;

/* 日志档案访问器 */
function LogFileAccessor(){
	this.root = "../../" ;
	this.extendName = ".klog" ;
	this.docs = {} ;
} ;
LogFileAccessor.prototype = {
	constructor : LogFileAccessor ,
	createDocument : function(options,files){
		let doc_name = options.name 
		, _this = this
		, path = _this.root + doc_name ;
		if(!doc_name || "string" != typeof doc_name){
			throw "无效的文档名" + doc_name ;
		}
		const _innerExist = function(exists){
			if(!exists){
				fs.mkdirSync(path) ;	
			}
			if(files && files.constructor === Array && files.length){
				files.forEach(function(file){
					if(!file.name || "string" != typeof file.name){
						throw "无效的文件名" + file.name ;
					}
					_this.createFile(file.name,doc_name) ;
				}) ;
			}
		} ;
		return new Promise(function(resolve,reject){
			fs.exists(path,function(exists){
				try{
					_innerExist(exists) ;
					resolve() ;
				}
				catch(E){
					reject(E) ;
				}	
			}) ;
		}) ;
	} ,
	createFile : function(name,doc_name,content){
		let path = this.root + doc_name + "/" + name + this.extendName
		, _this = this ; 
		if(!name || "string" != typeof name){
			throw "无效的文件名" + name ;
		}
		if(!doc_name || "string" != typeof doc_name){
			throw "无效的文档名" + doc_name ;
		}
		return new Promise(function(resolve,reject){
			fs.exists(path,function(exists){
				(function(){
					let s = "" ;
					if(content && "object" == typeof content){
						for(let prop in content){
							let v = content[prop] ;
							s += v + "\n" ;
						}
					}
					if(!exists){
						if(content && "object" == typeof content){
							fs.writeFileSync(path,s) ;
						}
						else{
							fs.writeFileSync(path,"") ;
						}
					}
					else{
						if(content && "object" == typeof content){
							fs.appendFileSync(path,s) ;
						}
					}
				})() ;
				resolve() ;
			}) ;
		}) ;
	} ,
	appendToDocument : function(file_name,doc_name){
		this.createFile(file_name,doc_name) ;
	} ,
	loadAll : function(){
		return this.docs ;
	} ,
	addDoc : function(name,doc){
		if(this.hasDoc(name)){
			throw "已存在的文档名" +  name ;
		}
		this.docs[name] = doc ;
	} ,
	hasDoc : function(name){
		return this.docs[name] ? true : false ;
	} ,
	getDoc : function(name){
		if(name && "stirng" == typeof name){
			return this.docs[name] ;
		}
		return this.docs ;
	}
} ;

/* 日志资源上报存储器 */
function ReportInternaLProcessor(options){
	this.remoteUrl      = options.remoteUrl ;
	this.mode           = "lazy" || options.mode ; // interval lazy immediately/atonce
	this.interval       = options.interval || (10 * 1000) ;
	this.log_cache      = [] ;
	this.request_result = [] ;
	if(!this.remoteUrl || "string" != typeof this.remoteUrl){
		this.remoteUrl  = "/" ;
	}
	this.initInternaL() ;
} ;
ReportInternaLProcessor.prototype = {
	constructor : ReportInternaLProcessor ,
	setRemoteUrl : function(remoteUrl){
		this.remoteUrl = remoteUrl ;
	} ,
	getRemoteUrl : function(){
		return this.remoteUrl ;
	} ,
	getCurrentMode : function(){
		return this.mode ;
	} ,
	getReportResult : function(){
		return this.request_result ;
	} ,
	getReportResultByStatus : function(stats){
		let result = this.request_result , ret_array = [] ;
		result.forEach(function(record){
			let v = record["stats"] ;
			if(v == stats){
				ret_array.push(record) ;
			}
		}) ;
		return ret_array ;
	} ,
	_submit : function(url,data){	
		return new Promise(function(resolve,reject){
			request(url,data,function(error,response,body){
				if (!error && response.statusCode == 200) {
					resolve() ;
				}
				else{	
					reject() ;
				}
			}) ;
		}) ;
	} ,
	initInternaL : function(){
		if(this.mode == "interval"){
			let _this = this ;
			setInterval(function(){
				_this.commit() ;
			},this.interval) ;
		}
	} ,
	write : function(info){
		let _this = this , record = {
			log : {
				date    : new Date().toLocaleString() ,
				content : info
			} ,
			stats   : "pendding"
		} ; 
		if(this.mode == "lazy"){
			this.log_cache.push(record.log) ;
		}
		else if(this.mode == "immediately"){
			this._submit(this.remoteUrl,record.log)
			.then(function(){
				record.stats = "success"  ;
				_this.request_result.push(record) ;
			})
			.catch(function(){
				record.stats = "fail"     ;
				_this.request_result.push(record) ;
			}) ;
		}
		else{
			return ;
		}
	} ,
	commit : function(callback){
		let log_cache = this.log_cache 
		, request_all = [] 
		, _this = this ;
		if(log_cache && log_cache.constructor === Array && log_cache.length){
			let _log = null ;
			while(_log = log_cache.shift()){
				let record = {
					log : {
						date    : _log.date ,
						content : _log.content
					} ,
					stats   : "pendding"
				} ;
				this._submit(this.remoteUrl,log)
				.then(function(){
					record.stats = "success"  ;
					_this.request_result.push(record) ;
				})
				.catch(function(){
					record.stats = "fail"     ;
					_this.request_result.push(record) ;
				}) ;
			}
			if(!log_cache.length){
				callback && callback(this.request_result) ;
			}
		}
		else{
			throw "无效的log_cache" ;
		}
	}
} ;

/* 核心引导类 */
class Lurker {
	constructor(options){
		
	}
	init(){
		
	}
} ;

function Log4Njs(options){
	//this.fileInternaLProcessor = new FileInternaLProcessor({}) ;
	// this.internaLProcessor = new MemoryInternaLProcessor() ;
	this.consoleInternaLProcessor = new ConsoleInternaLProcessor() ;
	 this.init() ;
	//
} ;
Log4Njs.prototype = {
	constructor : Log4Njs ,
	init : function(){
		let _this = this ;
		_this.fileInternaLProcessor.write({
			name : "12333" ,
			title : "eededed" ,
			content : "xsxs333"
		}) ;
		this.log("lurker-v-1.0") ;
		this.consoleInternaLProcessor.use("helloworld",{
			color : "inverse"
		},function(log,options){
			return "<" + log.date + ">" + " => " + log.content ;
		}) ;
		this.consoleInternaLProcessor.helloworld("Hello World") ;
	} ,
	log : function(info){
		this.consoleInternaLProcessor.log(info) ;
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