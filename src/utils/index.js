import {
	EditorState, 
	ContentState, 
	CompositeDecorator, 
	convertToRaw,
	convertFromRaw
} from 'draft-js'

import React from 'react'
import humanInterval from 'human-interval'

const storage = window.localStorage

function convert(entities, strategy){
	let converted = {}
	Object.keys(entities).forEach((x) => {
		const entity = entities[x]
		const conversion = strategy(entity)
		converted[x] = {...entity, ...conversion}
	})
	return converted
}

export function getStateFromLocalStorage(){
	const stateString = storage.getItem('line-time-state')
	if(stateString){
		const state = JSON.parse(stateString)
		const chunks = deserializeChunks(state.chunks)
		const notes = deserializeNotes(state.notes)
		return {...state, chunks: chunks, notes: notes}
	}
}

export function deserializeNotes(notes){
	return convert(notes, (note) => (
		{
			updatedAt: new Date(note.updatedAt)
		}
	))
}

export function serializeChunks(chunks){
	return convert(chunks, (chunk) => (
		{
			editorState: convertToRaw(chunk.editorState.getCurrentContent())
		}
	))
}

export function deserializeChunks(chunks) {
	return convert(chunks, (chunk) => {
		const content = convertFromRaw(chunk.editorState)
		return { 
			editorState: EditorState.createWithContent(content, compositeDecorator)
		}
	})
}

export function abbreviateTime(interval){
	const abbreviationMap = [['hours', 'hrs'], ['hour', 'hr'], ['minutes', 'min.'], ['minute', 'min'], ['seconds', 's'], ['second', ['s']]]
	const abbreviatedInterval = abbreviationMap.reduce((textMemo, abbrevPair) => {
		const long = abbrevPair[0]
		const short = abbrevPair[1]
		return textMemo.replace(long, short)
	}, interval)
	return abbreviatedInterval
}

export function emptyChunk(){
	return {
		intervalContent: "",
		intervalSeconds: 0,
		complete: false,
		editorState: EditorState.set(EditorState.createEmpty(), {decorator: compositeDecorator})
	}
}

export const firstLineStrategy = (contentBlock, callback, contentState) => {
	if(contentBlock.getKey() === contentState.getFirstBlock().getKey()){
		const lines = contentBlock.getText().split("\n")
		callback(0, lines[0].length)
	}
}

export const firstLineSpan = (props) => <span style={{fontWeight: "bold"}} className="first-line">{ props.children }</span>


export const compositeDecorator = new CompositeDecorator([
	{
		strategy: firstLineStrategy,
		component: firstLineSpan
	}
])

export function editorFromText(text){
	const content = ContentState.createFromText(text)
	const editorState =  EditorState.createWithContent(content)
	return EditorState.set(editorState, {decorator: compositeDecorator})
}

export function parseTime(timeText){
	const time = humanInterval(timeText)
	if(time){
		return time/1000
	}
}
export const getEntities = (editorState, entityType = null) => {
    const content = editorState.getCurrentContent();
    const entities = [];
    content.getBlocksAsArray().forEach((block) => {
        let selectedEntity = null;
        block.findEntityRanges(
            (character) => {
                if (character.getEntity() !== null) {
                    const entity = content.getEntity(character.getEntity());
                    if (!entityType || (entityType && entity.getType() === entityType)) {
                        selectedEntity = {
                            entityKey: character.getEntity(),
                            blockKey: block.getKey(),
                            entity: content.getEntity(character.getEntity()),
                        };
                        return true;
                    }
                }
                return false;
            },
            (start, end) => {
                entities.push({...selectedEntity, start, end});
            });
    });
    return entities;
}


export function findFirstIncompleteChunk(state){
	const note = state.notes[state.currentNote]
	const chunks = state.chunks
	const found =  note.chunks.find((chunkId) => { 
		const chunk = chunks[chunkId]
		return chunk.complete === false
	})
	return found
}
