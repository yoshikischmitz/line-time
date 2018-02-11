import {connect} from 'react-redux'
import {startTimer} from '../actions'
import DisplayTimer from '../components/DisplayTimer'

const mapStateToProps = (state, ownProps) => {
	return {seconds: state.timerSeconds}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: () => {
			dispatch(startTimer())
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayTimer)
