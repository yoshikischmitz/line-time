import {connect} from 'react-redux'
import DisplayNote from '../components/DisplayNote'

const mapStateToProps = (state, ownProps) => {
	const chunks = state.notes[ownProps.id].chunks
	return {
		chunks: chunks,
		updatedAt: state.notes[ownProps.id].updatedAt,
		id: ownProps.id
	}
}

export default connect(mapStateToProps, null)(DisplayNote)
