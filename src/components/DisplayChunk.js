import React from 'react'
import { Editor } from 'draft-js'
import {highlightBlue, darkGrey} from '../colors'
import { Draggable } from 'react-beautiful-dnd'
import { Icon } from '@doist/reactist'

const borderWidth = (complete) => complete ? "6px" : "4px"
const borderColor = (complete) => complete ? highlightBlue : darkGrey
const border = (needsBorder, complete) => (needsBorder ? {borderLeft: `solid ${ borderColor(complete) } ${ borderWidth(complete) }`} : {})

function timelineStyle(name, first, last, complete){
}

export const Timeline = ({first, last, complete, prevComplete}) => {
	const completeStyle = (complete) => (complete ? "complete" : "")
	const firstStyle = first ? "first" : ""
	const lastStyle = last ? "last" : ""
	const style = (name, complete) => `timeline-${name} ${firstStyle} ${lastStyle} ${completeStyle(complete)}`
	return(
		<div className="timeline">
			<div className={style('top', prevComplete)}></div>
			<div className={complete ? "bullet complete" : "bullet"} >
				<div className="inner">
				</div>
			</div>
			<div className={style('bottom', complete)} ></div>
		</div>
	)
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
			<Draggable draggableId={this.props.id} key={this.props.id} index={this.props.index}>
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
									{ intervalContent }
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
