import React from 'react'
import { Editor } from 'draft-js'
import {highlightBlue, darkGrey} from '../colors'

export default class DisplayChunk extends React.Component{
	constructor(props){
		super(props)
	}

	componentDidUpdate(){
		if(this.props.focused){
		  this.editorRef.focus()
		}
	}

	render(){
		const {intervalContent, intervalSeconds, editorState, onChange, 
				keyBindingFn, handleKeyCommand, complete, prevComplete, first, last} = this.props

		const color = "grey"
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
			style.color = "#BDBDBD",
			style.textDecoration = "line-through"
		}

		return(
			<div className="chunk" style={style} >
				<div className="interval" style={complete ? {textDecoration: "line-through"} : {}}>
					{ intervalContent }
				</div>
				<div className={complete ? "checkmark" : "bullet"} />
				<div className="separator" style={topStyle} />
				<div className="editor" style={editorStyle} >
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
		)
	}
}
