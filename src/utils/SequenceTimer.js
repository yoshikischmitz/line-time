export default class SequenceTimer {
	constructor(timers, onTimerEnd){
		this.timers = timers
		this.onTimerEnd = onTimerEnd
		this.index = 0
		this.timeoutComplete = this.timeoutComplete.bind(this)
	}

	timeoutComplete(){
		const atEnd = this.index === this.timers.length - 1
		if(atEnd){
			this.onTimerEnd(this.currentTimer(), true)
		} else {
			this.onTimerEnd(this.currentTimer(), false)
			this.index++
			this.start()
		}
	}

	currentTimer(){
		return this.timers[this.index]
	}

	start(){
		if(this.pausedTime){
			this.timeout = setTimeout(() => {
				this.timeoutComplete()
			}, this.pausedTime)
			this.pausedTime = null
		} else {
			this.timeout = setTimeout(() => {
				this.timeoutComplete()
			}, this.currentTimer())
		}
	  this.started = new Date()
	}

	pause(){
		clearTimeout(this.timeout)
		const elapsed = new Date() - this.started
		this.pausedTime = this.currentTimer() - elapsed
	}
}
