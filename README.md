# Welcome to Linetime, the time-aware todo list

![linetime screenshot](https://i.imgur.com/oDpaIDX.png)

# State:

```
{
        Notes: {
                [id] : {
                        chunks: [array of chunk Ids]
                }
        },
        Chunks: {
                [id] : {
                        editorState: [draftjs EditorState],
                        intervalContent: String,
                        intervalSeconds: Float,
                }
        },
        notificationsEnabled: Boolean,
        showSidebarMobile: Boolean,
        currentNote: NoteId,
        secondsRemaining: Float,
        timerState: <Playing, Paused, Stopped>,
        focus: ChunkId,
}
```

# TODO

# Priority

- add a button for removing time chunks

# Backlog:

- [ ]  add note titles
- [ ]  Notifications on iPhone broken.
- [ ]  autoplay
- [ ]  button for adding chunk at the end
- [ ]  show when a chunk was completed
- [ ]  copy note to clipboard
- [ ]  paste note from clipboard
- [ ]  add notification toggling to the document
- [ ]  undoing things
- [ ]  sound doesn’t play on Chrome
- [ ]  need to refresh the sidebar periodically so the times update
- [ ]  when focus changes after a new note was created without any contents, we should delete the new note.
- [ ]  ignore leading whitespace for timer entry

# Done:

- [x]  extract three reducers, one that handles chunks, one that handles ui, and one that handles notes
- [x]  Offline storage
  - needs to work with editorState
- [x]  get key back into chunks
- [x]  abbreviate time on mobile
- [x]  don’t show timelines when moving
- [x]  get sidebar working on mobile
- [x]  time of last edit at the right of the title in the sidebar
- [x]  reorder chunks
- [x]  center the borders
maybe use css border images?
- [x]  There is a sidebar on the left that lists all of the user’s notes
  - The notes are sorted by when they were last edited
    - updateChunk also update’s the last edited of the note
    - this should only trigger when the content changes:
    [Is there a way to distinguish what changed in onChange callback? · Issue #830 · facebook/draft-js · GitHub](https://github.com/facebook/draft-js/issues/830#issuecomment-264185874)
  - The currently selected note is highlighted
  - The notes should show their first chunk’s content, clipped to the space available, as well as a preview of the rest of the contents.
  - when you click on an item in this sidebar, the state should change the selected note to be the clicked note.
- [x]  When you press backspace at the beginning of a chunk, to edit the interval of that chunk, and the chunk gets merged up, the cursor is at the beginning of the chunk. The cursor should be at the same place.
- [x]  The first line should be bold
- [x]  get focus change working on up and down arrows
  - make sure focus is at the end of the editor
- [x]  fix add chunk focus issue
- [x]  get the default bank slate working
  - Editing the current time doesn’t work on initial load.
- [x]  button to enable notifications
- [x]  focus on chrome is broken
for some reason you can’t return the focus back to any element
The problem was this function in DisplayChunk.js:
- [x]  componentDidUpdate(){
      if(this.props.focused){   
        this.editorRef.focus()    
      }   
    }
- [x]  Parse each line and check if the first line has square brackets inside. If there are, then extract the contents of the brackets and figure out what time the text represents.
- [x]  Create an entity for each timer
  - make sure the selection only covers the area of the timer itself
- [x]  Start the timers when the user hits the start button
- [x]  discover the time entities
- [x]  add them to a list
- [x]  go through the list, sequentially creating a timer for each item.
- [x]  play and pause
- [x]  notification + sound when you complete an item
- [x]  Convert SPC handler into keybindingfn
- [x]  Emit Backspace action if we’re at the beginning of a chunk
- [x]  Backspace:
  - Merge chunk up
    1. Modifier.replaceText to insert the interval text into the content state
    And append that chunk’s blocks to the chunk above it.
    1. Find the chunk above the current one. Get its blocks.
    1. Get the blocks from the the content state returned from Modifier
    1. Combine those blocks into an array.
    Delete the current block
    1. Remove the chunk from the notes’s chunk array
    1. Delete it from the block object
    1. Return the new state
- [x]  Get rendering of the basic state working:
  - Install redux
  - Set up basic state
  - create reducers
  - create actions
  - Create containers and components for each level of the hierarchy
- [x]  Adding new chunks.
When you press space at the end of an interval declaration it creates a new chunk
Use `handleBeforeInput` to detect the space event
Then we need to clear the contentState of the text before the cursor.
draftRemovalDirection: ‘backward’
It should carry over the content that comes after it too.
- [x]  Change focus to the new chunk after creation.
- [x]  Fix space not working when you reenter a backspaced item
this was happening because getText() is based off of the text at the beginning of the block itself, without accounting for newlines
- [x]  Completed items should have a blue border on the left
- [x]  Get the player working
The player has a play button, pause button, and a countdown.
The player is at the current chunk. Originally this is the first chunk.
When you press play, the player starts the countdown.
When the player’s countdown ends, the chunk should be marked complete, and the current chunk should be forwarded.
- [x]  [40 minutes] deploy to google cloud
[How to deploy a static React site to Google Cloud Platform](https://medium.com/google-cloud/how-to-deploy-a-static-react-site-to-google-cloud-platform-55ff0bd0f509)
  - [15 minutes] make a build of the site
    - research how to make a build
  - [15 minutes] setup bucket
    - make a bucket
    - [10 minutes] push build to the instance
  - remove plugin code in production

