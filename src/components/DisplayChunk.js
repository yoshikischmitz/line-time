import React from 'react'
import { Editor } from 'draft-js'
import {highlightBlue, darkGrey} from '../colors'
import { Draggable } from 'react-beautiful-dnd'

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

		let topBorderWidth = "4px"
		let bottomBorderWidth = "4px"
		let topColor = darkGrey
		let bottomColor = darkGrey

		if(complete){
			topBorderWidth = "6px"
			bottomBorderWidth = "6px"
			topColor = highlightBlue
			bottomColor = highlightBlue
		}

		if(prevComplete){
			topBorderWidth = "6px"
			topColor = highlightBlue
		}

		let topStyle = {
			borderLeft: `solid ${ topColor } ${ topBorderWidth }`
		}

		let bottomStyle = {
			borderLeft: `solid ${ bottomColor } ${ bottomBorderWidth }`
		}

		if(first){
		  topStyle = {}
		} else if(last){
		  bottomStyle = {}
		} 

		let editorStyle = {
			borderLeft: `solid ${ bottomColor } ${ bottomBorderWidth }`
		}
		if(last){
			editorStyle = {}
		}

		let style = {}
		if(complete){
			style.color = "#BDBDBD"
			style.textDecoration = "line-through"
		}

		if(first && last){
			topStyle = {}
			bottomStyle = {}
			editorStyle = {}
		}

		return(
			<Draggable draggableId={this.props.id} index={this.props.index}>
				{(provided, snapshot) => (
					<div>
						<div 
							ref={provided.innerRef} 
							{...provided.draggableProps} 
							className="chunk" 
							style={{...style, ...provided.draggableProps.style}} 
							onClick={this.props.onClick}
						>
							<div 
								{...provided.dragHandleProps} 
								className="interval" 
								style={complete ? {textDecoration: "line-through"} : {}}>
							
								{ intervalContent }
							</div>
							<div className={complete ? "checkmark" : "bullet"} />
							<div className="separator" style={topStyle} />
							<div onKeyDown={(e) => this.props.onKeyDown(e, this.props.editorState)}className="editor" style={editorStyle} >
								<Editor 
									editorState={ editorState } 
									onChange={ onChange }
									keyBindingFn={(e) => keyBindingFn(e, editorState)}
									handleKeyCommand={(command) => handleKeyCommand(command, editorState)}
									ref={ref => this.editorRef = ref}
								/>
							</div>
							<div className="separator" style={bottomStyle}/>
							<div className="bottom-boundary" />
						</div>
					  {provided.placeholder}
					</div>
				)}
			</Draggable>
		)
	}
}
