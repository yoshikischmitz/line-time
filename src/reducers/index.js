import uuid from 'uuid'

import chunks from './chunks'
import notes from './notes'

import {
	AddChunk, 
	MergeChunkUp, 
	StartTimer, 
	SkipTimer,
	StopTimer,
	Tick, 
	Focus, 
	GotPermission, 
	MoveFocus,
	ToggleSidebar,
	ChangeNote,
	MakeNewNote,
} from '../actions/types'

import {
	parseTime, 
	editorFromText,
	findFirstIncompleteChunk,
	emptyChunk,
	getStateFromLocalStorage
} from '../utils'

const Playing = 'Playing'
const Paused = 'Paused'
const Stopped = 'Stopped'

function chunk(intervalText, text, complete){
	return {
		intervalContent: intervalText,
		intervalSeconds: parseTime(intervalText),
		complete: complete,
		editorState: editorFromText(text)
	}
}

const notificationsEnabled = Notification.permission === 'granted'

function generateInitialState(){
	const current = uuid()
	const note2 = uuid()
	const note3 = uuid()

	const chunk1 = uuid()
	const chunk2 = uuid()
	const chunk3 = uuid()
	const chunk4 = uuid()
	const chunk5 = uuid()
	const chunk6 = uuid()
	const chunk7 = uuid()
	const chunk8 = uuid()

	return {
		notificationsEnabled: notificationsEnabled,
		showSidebarMobile: false,
		currentNote: current,
		secondsRemaining: 0,
		timerState: Stopped,
		focus: chunk1,
		notes: {
			[current]: {
				updatedAt: new Date(),
				chunks: [
					chunk1,
					chunk2,
					chunk3,
					chunk4,
					chunk5,
					chunk6,
					chunk7,
					chunk8
				]
			}
		},
		chunks: {
			[chunk1] : chunk("25 minutes", "Work", false),
			[chunk2] : chunk("5 minutes", "Take a break", false),
			[chunk3] : chunk("25 minutes", "Work", false),
			[chunk4] : chunk("5 minutes", "Take a break", false),
			[chunk5] : chunk("25 minutes", "Work", false),
			[chunk6] : chunk("5 minutes", "Take a break", false),
			[chunk7] : chunk("25 minutes", "Work", false),
			[chunk8] : chunk("20 minutes", "Take a long break", false),
		}
	}
}

let initialState = {...getStateFromLocalStorage(), notificationsEnabled: notificationsEnabled}
if(initialState === undefined){
	initialState = generateInitialState()
}

function updateCurrentNote(state, update){
	return {
		...state.notes,
		[state.currentNote]: {
			...state.notes[state.currentNote],
			...update
		}
	}
}

function startNextTimer(state){
	const found = findFirstIncompleteChunk(state)
	if(found){
		const seconds = state.chunks[found].intervalSeconds
		if(seconds > 0){
			return {...state, secondsRemaining: state.chunks[found].intervalSeconds, currentChunk: found, timerState: Playing}
		}
	}
	return {...state, timerState: Stopped}
}

function toggleTimer(state, action){
	switch(state.timerState){
		case(Playing):{
		  return {...state, timerState: Paused}
		}
		case(Paused):{
		  return {...state, timerState: Playing}
		}
		case(Stopped):{
			return startNextTimer(state)
		}
		default:{
			return state
		}
	}
}

function endTimer(state) {
	// get next chunk, make a notification for it, set it to be current
	const currentChunk = state.currentChunk
	const currentChunkIndex = state.notes[state.currentNote].chunks.indexOf(currentChunk)
	const note = state.notes[state.currentNote]

	let text = ""
	let nextChunkId
	let nextChunk = {}
	let noteUpdate = {}

	if(currentChunkIndex + 1 < note.chunks.length ){
		nextChunkId = note.chunks[currentChunkIndex + 1]
		nextChunk = state.chunks[nextChunkId]
		text = nextChunk.editorState.getCurrentContent().getFirstBlock().getText().split("\n")[0]
	} else {
		nextChunkId = uuid()
		nextChunk = emptyChunk()
		noteUpdate = {chunks: note.chunks.concat([nextChunkId])}
		text = "wowee you're out of stuff to do!"
	}

  new Notification(text)

	return {
		...state, 
		currentChunk: null,
		timerState: Stopped,
		focus: nextChunkId,
		notes: updateCurrentNote(state, noteUpdate),
		chunks: {
			...state.chunks, 
			[currentChunk]: {
				...state.chunks[currentChunk],
				complete: true
			},
			[nextChunkId] : nextChunk
		}
	}
}

function tick(state){
	if(state.timerState !== Playing){
		return state
	}

	if(state.secondsRemaining > 0){
		return {...state, secondsRemaining: state.secondsRemaining - 1}
	}

	return endTimer(state)
}

function root(state = {}, action){
	switch(action.type){
		case(AddChunk):{
			return {...state, focus: action.newChunkId}
		}
		case(MergeChunkUp):{
			let focus = state.focus
			if(action.upperChunkId){
				focus = action.upperChunkId
			}
			return {...state, focus: focus}
		}
		case(StartTimer):{
			return toggleTimer(state, action)
		}
		case(StopTimer):{
		  return {...state, currentChunk: null, timerState: Stopped}
		}
		case(SkipTimer) : {
		  return startNextTimer(endTimer(state))
		}
		case(Tick): {
			return tick(state)
		}
		case(MoveFocus) : {
			return {...state, focus: action.to}
		}
		case(Focus):{
			return {...state, focus: action.id}
		}
		case(GotPermission):{
			return {...state, notificationsEnabled: true}
		}
		case(ChangeNote):{
			return {...state, currentNote: action.id, showSidebarMobile: false}
		}
		case(MakeNewNote):{
			return {...state, currentNote: action.noteId}
		}
		case(ToggleSidebar):{
			return {...state, showSidebarMobile: !state.showSidebarMobile}
		}
		default: {
			return state
		}
	}
}
export default (state = initialState, action) => {
	const noteUpdate = notes(state.notes, action)
	const chunksUpdate = chunks(state.chunks, action)

	const merged = {...state, notes: noteUpdate, chunks: chunksUpdate}
	const rootUpdate = root(merged, action)

	return rootUpdate
}
