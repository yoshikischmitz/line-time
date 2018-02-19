import {connect} from 'react-redux'
import {startTimer} from '../actions'
import {findFirstIncompleteChunk} from '../utils'
import DisplayTimer from '../components/DisplayTimer'

const mapStateToProps = (state, ownProps) => {
	let seconds
	if(state.timerState === 'Playing'){
		seconds = state.secondsRemaining
	} else {
	  const chunk = findFirstIncompleteChunk(state)
	  seconds = chunk ? state.chunks[chunk].intervalSeconds || 0 : 0
	}
  return {seconds: seconds, state: state.timerState}
}

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		onClick: () => {
			dispatch(startTimer())
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(DisplayTimer)
