import React from 'react'
import { Editor } from 'draft-js'
import {highlightBlue, darkGrey} from '../colors'
import { Draggable } from 'react-beautiful-dnd'

const borderWidth = (complete) => complete ? "6px" : "4px"
const borderColor = (complete) => complete ? highlightBlue : darkGrey
const border = (needsBorder, complete) => (needsBorder ? {borderLeft: `solid ${ borderColor(complete) } ${ borderWidth(complete) }`} : {})

function timelineTopStyle(first, complete){
	const completeStyle = complete ? "complete" : ""
	const firstStyle = first ? "first" : ""
	return `timeline-top ${firstStyle} ${completeStyle}` 
}

function timelineBottomStyle(last, complete){
	const completeStyle = complete ? "complete" : ""
	const lastStyle = last ? "last" : ""
	return `timeline-bottom ${lastStyle} ${completeStyle}` 
}

export default class DisplayChunk extends React.Component{
	constructor(props){
		super(props)
	}

	componentDidMount(){
		if(this.props.focused){
		  this.editorRef.focus()
		}
	}

	componentDidUpdate(prevProps){
		if(this.props.focused){
		  this.editorRef.focus()
		}
	}

	render(){
		const {intervalContent, editorState, onChange, 
				keyBindingFn, handleKeyCommand, complete, prevComplete, first, last} = this.props

		return(
			<Draggable draggableId={this.props.id} key={this.props.id} index={this.props.index}>
				{(provided, snapshot) => (
					<div>
						<div 
							className={ complete ? "chunk complete" : "chunk"}
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
									{ intervalContent }
								</div>
						  </div>
							<div className="timeline">
								<div className={timelineTopStyle(first, prevComplete)}></div>
								<div className={complete ? "bullet complete" : "bullet"} >
									<div className="inner">
									</div>
								</div>
								<div className={timelineBottomStyle(last, complete)} ></div>
							</div>
							<div className="editor" onKeyDown={(e) => this.props.onKeyDown(e, this.props.editorState)}>
								<Editor 
									editorState={ editorState } 
									onChange={ onChange }
									keyBindingFn={(e) => keyBindingFn(e, editorState)}
									handleKeyCommand={(command) => handleKeyCommand(command, editorState)}
									ref={ref => this.editorRef = ref}
								/>
							</div>
						</div>
					  {provided.placeholder}
					</div>
				)}
			</Draggable>
		)
	}
}
