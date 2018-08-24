/*
 * @author Bigbear Wang. Ziyue
 */

class LoggerBackground {
	constructor(_super,options){
		this._super     = _super ;
		this.interval   = options.interval ;
		this.started    = false ;
		this.count_data = {} ;
		this.watches    = {} ;
		this.handles = {} ;
		this.start() ;
	}
	init(){
		
	}
	start(){
		if(this.started){
			return ;
		}
		this.started = true ;
	}
	stop(){
		
	}
} ;

module.exports = LoggerBackground ;
