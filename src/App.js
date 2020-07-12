import React, { useEffect } from "react";
import { motion } from "framer-motion";

import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { direction, tileType } from "./state/gameUtil";
import { actions as playerActions } from "./state/player";

import snow from "./assets/source (7).gif";
import { Vector2 } from "./state/lib/Vector2";
const handleKeyEvent = ({ key, shiftKey }) => {
  const keyMapper = {
    ArrowRight: () => playerActions.moveRight(shiftKey),
    ArrowLeft: () => playerActions.moveLeft(shiftKey),
    ArrowUp: () => playerActions.moveUp(shiftKey),
    ArrowDown: () => playerActions.moveDown(shiftKey),
    [" "]: () => playerActions.scoop(),
  };
  console.log(key);
  return key in keyMapper ? keyMapper[key]() : null;
};

const isOneOfAtTile = (entries, tile) =>
  entries.find((entry) => isEntryAtTile(entry, tile));
const isEntryAtTile = (entry, tile) => {
  return entry.position.equals(tile.position);
};

const Tree = () => <code className="tile">🌲️</code>;
const Snow = ({ depth }) => (
  <div className={`tile snow depth-${Math.abs(depth)}`}>❄️</div>
);
const BadKid = ({ ball }) => (
  <div className="tile badKid">😈{ball ? "b" : ""}</div>
);
const SnowBall = ({ quality }) => (
  <div className={`tile snowBall quality-${quality}`}>⚪️</div>
);
const Player = ({ status }) => (
  <div className={`tile player ${status}`}>🙃</div>
);

function App() {
  const dispatch = useDispatch();
  const s = useSelector((s) => s);

  const map = s.world.map((row) =>
    row.map(
      (tile) =>
        ({
          [tile.type === tileType.snow]: <Snow {...tile} />,
          [tile.type === tileType.tree]: <Tree {...tile} />,
          [!!isOneOfAtTile(s.badKids, tile)]: (
            <BadKid
              {...s.badKids.find((entry) => isEntryAtTile(entry, tile))}
            />
          ),
          [!!isOneOfAtTile(s.balls, tile)]: (
            <SnowBall
              {...s.balls.find((entry) => isEntryAtTile(entry, tile))}
            />
          ),
          [isEntryAtTile(s.player, tile)]: <Player {...s.player} />,
        }[true])
    )
  );

  const { x, y } = s.player.position;

  const [facing] = Object.entries(direction).find(([, vec]) =>
    vec.equals(s.player.facing)
  );

  const pixelSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel-size")
  );
  const camera_left = pixelSize * 25;
  const camera_top = pixelSize * 21;

  useEffect(() => {
    const go = (e) => {
      const a = handleKeyEvent(e);
      if (a) dispatch(a);
    };
    document.addEventListener("keyup", go);
    return () => document.removeEventListener("keyup", go);
  }, [dispatch]);

  return (
    <div className="frame">
      <pre id="playerStatus">
        <code>{s.player.status}</code>,<code>{s.player.coldness}</code>,
        <code>{s.player.wetness}</code>
      </pre>
      <div className="corner_topleft" />
      <div className="corner_topright" />
      <div className="corner_bottomleft" />
      <div className="corner_bottomright" />
      <div className="camera">
        {s.player.coldness === 30 && <h1 id="gameover">Game Over</h1>}
        <img id="snowGif" src={snow} alt="loading..." />
        <div
          key="map"
          className="map pixel-art"
          style={{
            transform: `translate3d( ${-x * 30 * pixelSize + camera_left}px, ${
              -y * 30 * pixelSize + camera_top
            }px, 0 )`,
          }}
        >
          {/*<div className="character" facing={facing} walking="true">*/}
          {/*  <div className="shadow pixel-art" />*/}
          {/*  <div className="character_spritesheet pixel-art" />*/}
          {/*</div>*/}

          {map}
        </div>
      </div>
    </div>
  );
}

export default App;
