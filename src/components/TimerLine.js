import React, { Component } from 'react';
import uuid from 'uuid'
import PlayPauseButton from './PlayPauseButton'
import SequenceTimer from '../utils/SequenceTimer'

import {CompositeDecorator, Editor, EditorState, Modifier, SelectionState, convertToRaw} from 'draft-js';
import {getEntities} from '../utils'

const humanInterval = require('human-interval');
const TIME_BLOCK_REGEX = /^\[(.*)\]+/g;

function timeStrategy(contentBlock, callback, contentState) {
	contentBlock.findEntityRanges(
		(character) => {
			const entityKey = character.getEntity();
			return (
				entityKey !== null &&
				contentState.getEntity(entityKey).getType() === 'TIMER'
			);
		},
		callback
	);
}

function findWithRegex(regex, contentBlock, callback) {
	const text = contentBlock.getText();
	let matchArr, start;
	while ((matchArr = regex.exec(text)) !== null) {
		const timeText = matchArr[1]
		const time = humanInterval(timeText)
		if(time){
			start = matchArr.index;
			callback(start, start + matchArr[0].length);
		}
	}
}

class TimeSpan extends React.Component {
	constructor(){
		super()
		this.state = {id: uuid()}
	}

	render(){
		const myData = this.props.contentState.getEntity(this.props.entityKey).getData();
		let classes = "timer"
		if(myData.current){
			classes += " current"
		}
		console.log("got updated in Timespan", myData)
		return (
			<span className={classes}>
				<div className="bullet"></div>
				<a
					className="time"
					data-offset-key={this.props.offsetKey}
				>
					{this.props.children}
				</a>
		  </span>
		);
	}
};

function timerStyle(contentBlock){
}

class TimerLine extends React.Component {
	constructor() {
		super();
		const compositeDecorator = new CompositeDecorator([
			{
				strategy: timeStrategy,
				component: TimeSpan,
			}
		]);

		this.state = {
			editorState: EditorState.createEmpty(compositeDecorator),
			playing: false
		};

		this.focus = () => this.refs.editor.focus();
		this.onChange = this.onChange.bind(this)
		this.onClick = this.onClick.bind(this)
		this.timerEnd = this.timerEnd.bind(this)
	}

	onChange(editorState) {
	  const contentState = editorState.getCurrentContent()
		const selection = editorState.getSelection()
		const anchorKey = selection.getAnchorKey()
		const currentContentBlock = contentState.getBlockForKey(anchorKey);
		const text = currentContentBlock.getText()
    const matchArr = TIME_BLOCK_REGEX.exec(text)
		if(matchArr){
			const bracketText = matchArr[1]
			const interval = humanInterval(bracketText)
			if(interval){
				const entitySelection = selection.merge({anchorOffset: 0, focusOffset: bracketText.length + 2})

				const contentStateWithEntity = contentState.createEntity(
					'TIMER',
					'IMMUTABLE',
					{interval: interval, content: text}
				);

				const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
				const contentStateWithInterval = Modifier.applyEntity(
					contentStateWithEntity,
					entitySelection,
					entityKey
				);

				const newState = EditorState.set(editorState, {currentContent: contentStateWithInterval})

				this.setState({editorState: newState})
			} else {
				this.setState({editorState: editorState})
			}
		} else {
			this.setState({editorState: editorState})
		}
	}

	onClick() {
	  this.updateHighlight(0)
		if(this.state.playing){
		  this.state.timer.pause()
			this.setState({playing: false})
		} else {
			let timer = this.state.timer
			if(timer){
				this.state.timer.start()
				this.setState({playing: true})
			  this.updateHighlight(timer.index)
			} else {
				const entities = getEntities(this.state.editorState, 'TIMER')
				const intervals = entities.map((e) => e.entity.getData().interval)
				if(intervals.length > 0){
					timer = new SequenceTimer(intervals, this.timerEnd)
					timer.start()
					this.setState({timer: timer, playing: true})
			    this.updateHighlight(timer.index)
				}
			}
		}
	}

	updateHighlight(index){
		const editorState = this.state.editorState
		const entities = getEntities(editorState, 'TIMER')
		const currentEntity = entities[index]
	  const contentState = this.state.editorState.getCurrentContent()
		const newContent = contentState.mergeEntityData(
			currentEntity.entityKey,
			{current: true}
		)

		const stateWithUpdatedEntity = EditorState.set(editorState, {currentContent: newContent})

		this.setState({editorState: stateWithUpdatedEntity}, () => { 
		   this.setState({editorState: EditorState.forceSelection(this.state.editorState, this.state.editorState.getSelection())})
		})
	}

	notify(notification){
		const options ={
			icon: "https://cdn0.iconfinder.com/data/icons/feather/96/clock-512.png"
		}
		if(Notification.permission === "granted"){
			new Notification(notification, options)
		} else {
			Notification.requestPermission(function(permission){
				if (permission === "granted") {
					new Notification(notification, options);
				}
			})
		}
	}

	timerEnd(time, last) {
		if(last){
			this.setState({playing: false})
		} 
		const entities = getEntities(this.state.editorState, 'TIMER')
		const currentEntity = entities[this.state.timer.index + 1]
		if(currentEntity){
			const entity = currentEntity.entity;
			this.notify(entity.getData().content)
		} else {
			this.notify("You're done!")
		}
	}

	render() {
		return (
			<div className="container">
				<div className="editor" style={styles.editor} onClick={this.focus}>
					<Editor
						editorState={this.state.editorState}
						onChange={this.onChange}
						ref="editor"
						spellCheck={false}
						blockStyleFn={timerStyle}
					/>
				</div>
				<PlayPauseButton playing={this.state.playing} onClick={this.onClick} />
			</div>
		);
	}
}

const styles = {
	editor: {
		cursor: 'text'
	}
}

export default TimerLine
