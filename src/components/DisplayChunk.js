import React from 'react'
import { Editor } from 'draft-js'
import { Draggable } from 'react-beautiful-dnd'
import {abbreviateTime} from '../utils'
import  Timeline  from './Timeline'

export default class DisplayChunk extends React.Component{
	className(complete, current){
		let classes = ["chunk"]
		if(complete){
			classes.push("complete")
		}

		if(current){
			classes.push("current")
		}
		return classes.join(" ")
	}

	render(){
		const {intervalContent, editorState, onChange, 
				keyBindingFn, handleKeyCommand, complete, prevComplete, first, last} = this.props

		return(
			<Draggable draggableId={this.props.id} index={this.props.index}>
				{(provided, snapshot) => (
					<div>
						<div 
							className={this.className(this.props.complete, this.props.current)}
							ref={provided.innerRef} 
							{...provided.draggableProps} 
							style={provided.draggableProps.style} 
							onClick={this.props.onClick}
						>
							<div className="interval" {...provided.dragHandleProps}>
								<div  className="interval-long">
									{ intervalContent }
								</div>
								<div  className="interval-short">
									{ abbreviateTime(intervalContent) }
								</div>
						  </div>
							<Timeline first={first} last={last} complete={complete} prevComplete={prevComplete}/>
							<div className="editor" onKeyDown={(e) => this.props.onKeyDown(e, this.props.editorState)}>
							  { this.props.countdown }
								<Editor 
									editorState={ editorState } 
									onChange={ (e) => onChange(editorState, e) }
									keyBindingFn={(e) => keyBindingFn(e, editorState)}
									handleKeyCommand={(command) => handleKeyCommand(command, editorState, this.props.intervalContent.length === 0)}
									ref={ref => this.editorRef = ref}
								/>
								{ this.props.controller }
							</div>
						</div>
					  {provided.placeholder}
					</div>
				)}
			</Draggable>
		)
	}
}
