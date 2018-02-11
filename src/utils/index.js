import React from 'react'
import humanInterval from 'human-interval'

export const firstLineStrategy = (contentBlock, callback, contentState) => {
	if(contentBlock === contentState.getFirstBlock()){
		const lines = contentBlock.getText().split("\n")
		callback(0, lines[0].length)
	}
}

export const firstLineSpan = ({children}) => <span className="first-line">{ children }</span>

export function parseTime(timeText){
	const time = humanInterval(timeText)
	if(time){
	  console.log(timeText, time)
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

