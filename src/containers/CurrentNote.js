import {connect} from 'react-redux'
import Note from './Note'

const mapStateToProps = (state) => {
	const currentNote = state.currentNote
	return {
		id: currentNote
	}
}

export default connect(mapStateToProps, null)(Note)



