import React, { useEffect, useRef } from "react";
import wind from "./assets/wind.mp3";
import scoop from "./assets/scoop.mp3";
import Animate from "react-smooth";
import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { tileType, dirFromVector } from "./state/gameUtil";
import { actions as playerActions } from "./state/player";

import snow from "./assets/snowing.gif";

const handleKeyEvent = ({ key, shiftKey }) => {
  const keyMapper = {
    ArrowRight: () => playerActions.moveRight(shiftKey),
    ArrowLeft: () => playerActions.moveLeft(shiftKey),
    ArrowUp: () => playerActions.moveUp(shiftKey),
    ArrowDown: () => playerActions.moveDown(shiftKey),
    [" "]: () => playerActions.scoop(),
  };

  return key in keyMapper ? keyMapper[key]() : null;
};

const isOneOfAtTile = (entries, tile) =>
  entries.find((entry) => isEntryAtTile(entry, tile));
const isEntryAtTile = (entry, tile) => {
  return entry.position.equals(tile.position);
};

const tileSize = 10;
const Tile = ({ children, className, position, depth = 0, ...props }) => (
  <>
    <div
      style={{
        height: tileSize,
        width: tileSize,
      }}
      data-x={position.x}
      data-y={position.y}
      className={`tile-text depth-${Math.abs(depth)} ${className}`}
    >
      {children}
    </div>
  </>
);
const Tree = (tileProps) => (
  <Tile {...tileProps} className="tree">
    🌲️
  </Tile>
);
const Snow = (tileProps) => <Tile {...tileProps} className={`snow `}></Tile>;
const BadKid = ({ ball, facing, ...tileProps }) => (
  <Tile {...tileProps} className="tile badKid">
    😈{ball ? "b" : ""}, {dirFromVector(facing).split("")[0]}
  </Tile>
);
const SnowBall = ({ quality, ...tileProps }) => (
  <Tile {...tileProps} className={`snowBall quality-${quality}`}>
    ⚪️
  </Tile>
);
const Player = ({ status, hit, ...tileProps }) => (
  <Tile
    {...tileProps}
    className={`player ${status} animated bounce ${hit ? "hit" : ""}`}
  >
    😄
  </Tile>
);

function App() {
  const dispatch = useDispatch();
  const s = useSelector((s) => s);
  const gameOver = s.player.coldness === 60;

  const map = s.world.map((row, y) => (
    <span className="row" key={`row-${y}`}>
      {row
        .filter((tile) => tile.position.distanceTo(s.player.position) < 9)
        .map((tile) =>
          ({
            [tile.type === tileType.snow]: () => (
              <Snow {...tile} key={`${tile.position.x},${tile.position.y}`} />
            ),
            [tile.type === tileType.tree]: () => (
              <Tree {...tile} key={`${tile.position.x},${tile.position.y}`} />
            ),
            [!!isOneOfAtTile(s.badKids, tile)]: () => (
              <BadKid
                {...tile}
                {...s.badKids.find((entry) => isEntryAtTile(entry, tile))}
                key={`${tile.position.x},${tile.position.y}`}
              />
            ),
            [!!isOneOfAtTile(s.balls, tile)]: () => (
              <SnowBall
                {...tile}
                {...s.balls.find((entry) => isEntryAtTile(entry, tile))}
                key={`${tile.position.x},${tile.position.y}`}
              />
            ),
            [isEntryAtTile(s.player, tile)]: () => (
              <Snow {...tile} key={`${tile.position.x},${tile.position.y}`} />
            ),
          }[true]())
        )}
    </span>
  ));

  const { x, y } = gameOver ? s.badKids[0].position : s.player.position;
  const viewBoxMargin = 40;
  const viewBox = {
    minX: x * tileSize - viewBoxMargin,
    minY: y * tileSize - viewBoxMargin,
  };

  const prevvb = useRef({
    minX: x * tileSize - viewBoxMargin,
    minY: y * tileSize - viewBoxMargin,
  });

  function vbAnim(oldvb, newvb) {
    prevvb.current = newvb;
    return {
      from: { ...oldvb },
      to: { ...newvb },
    };
  }

  const { from, to } = vbAnim(prevvb, viewBox);

  const pixelSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel-size")
  );

  useEffect(() => {
    const go = (e) => {
      const a = handleKeyEvent(e);

      if (a) {
        if (
          a.type === "scoop" &&
          !s.player.ball &&
          scoopSoundController.current
        ) {
          scoopSoundController.current.currentTime = 2;
          scoopSoundController.current.play();
        }
        dispatch(a);
      }
    };
    document.addEventListener("keyup", go);
    return () => document.removeEventListener("keyup", go);
  }, [dispatch]);

  const windController = useRef(null);
  const scoopSoundController = useRef(null);
  useEffect(() => {
    if (windController.current) {
      windController.current.volume = 0.3;
      windController.current.play();
    }
  }, [windController]);
  return (
    <>
      <pre id="playerStatus">
        <code>{s.player.status}</code>
        {s.player.ball && "⚪️"}
        <div>
          <code>Wet: {s.player.wetness}</code>
        </div>
        <div>
          <code>
            {
              {
                [true]: "I'm too damn cold, I'm going home!",
                [(s.player.coldness / 60) * 100 <
                75]: "Alright now I'm cold, we should probably wrap up soon",
                [(s.player.coldness / 60) * 100 <
                50]: "Alright, I'm a little cold buuut Snow Ball Fight!!",
                [(s.player.coldness / 60) * 100 <
                25]: "It's not so cold. Snow Ball Fight!",
              }[true]
            }
          </code>
          <div className="coldbar">
            <div
              className="coldfill"
              style={{ width: `${(s.player.coldness / 60) * 100}%` }}
            />
          </div>
        </div>
      </pre>
      <div className="frame">
        <audio src={wind} ref={windController} loop={true} />
        <audio src={scoop} ref={scoopSoundController} />

        {s.player.coldness === 60 && <h1>Game Over! 🥶 Thanks For Player</h1>}
        <img id="snowGif" src={snow} alt="loading..." />
        <Animate
          from={{
            y: s.player.prevPos?.y ?? 0,
            x: s.player.prevPos?.x ?? 0,
            ...from,
          }}
          to={{ y: s.player.position.y, x: s.player.position.x, ...to }}
          duration={300}
        >
          {({ minX, minY, x, y }) => {
            return (
              <svg
                viewBox={
                  /*Object.values(viewBox).join(" ")*/ `${minX} ${minY} ${
                    2 * viewBoxMargin
                  }, ${2 * viewBoxMargin}`
                }
              >
                <foreignObject x={0} y={0} height={1000} width={1000}>
                  <main>{map}</main>
                </foreignObject>
                {s.player.coldness < 60 && (
                  <foreignObject
                    key="player"
                    id="player-pos"
                    x={s.player.position.x * tileSize}
                    y={s.player.position.y * tileSize}
                    height={10}
                    width={10}
                  >
                    <Player {...s.player} />
                  </foreignObject>
                )}
              </svg>
            );
          }}
        </Animate>
      </div>
    </>
  );
}

export default App;
