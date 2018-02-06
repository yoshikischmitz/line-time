import React, { Component } from 'react';
import uuid from 'uuid'
import PlayPauseButton from './PlayPauseButton'
import SequenceTimer from '../SequenceTimer'

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
		this.state = {id: uuid(), timerStarted: false}
		this.timer = this.timer.bind(this)
	}

	timer(){
		console.log("hi");
	}

	componentWillUnmount(){
		clearInterval(this.state.interval)
	}

	render(){
		return (
			<span className="timer">
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
		};

		this.focus = () => this.refs.editor.focus();
		this.onChange = this.onChange.bind(this)
		this.onPlay = this.onPlay.bind(this)
		this.onPause = this.onPause.bind(this)
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
					{interval: interval}
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

	onPlay() {
		if(this.state.timer){
			this.state.timer.start()
		} else {
			const entities = getEntities(this.state.editorState, 'TIMER')
			const intervals = entities.map((e) => e.entity.getData().interval)
			const timer = new SequenceTimer(intervals, this.timerEnd)
			timer.start()
			this.setState({timer: timer})
		}
	}

	onPause(){
		this.state.timer.pause()
	}

	timerEnd(time, last) {
		console.log(time, last)
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
				<PlayPauseButton onPlay={this.onPlay} onPause={this.onPause}/>
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
