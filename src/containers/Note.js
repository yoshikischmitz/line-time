import {connect} from 'react-redux'
import DisplayNote from '../components/DisplayNote'

const mapStateToProps = (state, ownProps) => {
	return state.notes[ownProps.id]
}

export default connect(mapStateToProps, null)(DisplayNote)
