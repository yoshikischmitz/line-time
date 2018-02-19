import React from 'react'
import { Editor } from 'draft-js'
import {highlightBlue, darkGrey} from '../colors'
import { Draggable } from 'react-beautiful-dnd'

const borderWidth = (complete) => complete ? "6px" : "4px"
const borderColor = (complete) => complete ? highlightBlue : darkGrey
const border = (needsBorder, complete) => (needsBorder ? {borderLeft: `solid ${ borderColor(complete) } ${ borderWidth(complete) }`} : {})

const Separator = ({needBorder, complete}) => {
	let style = {}
  style = border(needBorder, complete)
	return <div className="separator" style={style} />
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

		let editorStyle = border(!last, complete)

		let style = {}

		if(complete){
			style.color = "#BDBDBD"
			style.textDecoration = "line-through"
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
							<Separator needBorder={!first} complete={prevComplete} />
							<div onKeyDown={(e) => this.props.onKeyDown(e, this.props.editorState)}className="editor" style={editorStyle} >
								<Editor 
									editorState={ editorState } 
									onChange={ onChange }
									keyBindingFn={(e) => keyBindingFn(e, editorState)}
									handleKeyCommand={(command) => handleKeyCommand(command, editorState)}
									ref={ref => this.editorRef = ref}
								/>
							</div>
							<Separator needBorder={!last} complete={complete} />
							<div className="bottom-boundary" />
						</div>
					  {provided.placeholder}
					</div>
				)}
			</Draggable>
		)
	}
}
