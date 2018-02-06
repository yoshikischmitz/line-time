import React, { Component } from 'react';

export default class PlayPauseButton extends Component {
	constructor(props){
		super(props)
		this.state = {playerState: 'paused'}
		this.onClick = this.onClick.bind(this)
	}

	onClick(){
		let newState
		if(this.state.playerState === 'paused'){
			newState = 'playing'
			this.props.onPlay()
		} else {
			newState = 'paused'
			this.props.onPause()
		}
		this.setState({playerState: newState})
	}

	render(){
		let classes = ["playback-button", this.state.playerState].join(" ")
		return(
			<div className={classes} onClick={this.onClick}>
			</div>
		)
	}
}
