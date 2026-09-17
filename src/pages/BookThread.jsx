import { useParams } from 'react-router-dom'

function BookThread() {
  const { bookId } = useParams()

  return (
    <div>
      <h1>Book Thread: {bookId}</h1>
    </div>
  )
}

export default BookThread
