import {connect} from 'react-redux'
import {changeNote} from '../actions'
import SidebarNote from '../components/SidebarNote'

const mapStateToProps = (state, ownProps) => {
	return {
		title: ownProps.id.slice(0, 10),
		contentPreview: "test"
	}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: () => {
			dispatch(changeNote(ownProps.id))
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(SidebarNote)
