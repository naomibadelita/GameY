import { useBoardSizeViewModel } from './hooks/useBoardSizeViewModel';
import './BoardSize.css';

export default function BoardSize() {
  const { state, actions } = useBoardSizeViewModel();

  return (
    <div className="board-size-container">
        <div className="board-content">
            <h1 className="board-title">Game Y</h1>
            <p className="board-size">Choose Board Size</p>

            {state.botGame ? (
              <label className="difficulty-control">
                <span>Difficulty</span>
                <select
                  value={state.difficulty}
                  onChange={(event) => actions.setDifficulty(event.target.value as typeof state.difficulty)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="adaptive">Adaptive</option>
                </select>
              </label>
            ) : null}

            <div className="board-size-options">
            {state.availableSizes.map((size) => (
                <button
                key={size}
                type="button"
                className="board-size-btn primary-btn"
                onClick={() => actions.selectBoardSize(size)}
                >
                {size} X {size}
                </button>
            ))}
            </div>
      </div>
    </div>
  );
}
