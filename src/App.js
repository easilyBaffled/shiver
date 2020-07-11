import React, { useEffect } from "react";
import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { direction, tileType } from "./state/gameUtil";
import { actions as playerActions } from "./state/player";
import { Vector2 } from "./state/lib/Vector2";
const handleKeyEvent = ({ key, shiftKey }) => {
  const keyMapper = {
    ArrowRight: () => playerActions.moveRight(shiftKey),
    ArrowLeft: () => playerActions.moveLeft(shiftKey),
    ArrowUp: () => playerActions.moveUp(shiftKey),
    ArrowDown: () => playerActions.moveDown(shiftKey),
  };
  return key in keyMapper ? keyMapper[key]() : null;
};

const isOneOfAtTile = (entries, tile) =>
  entries.find((entry) => isEntryAtTile(entry, tile));
const isEntryAtTile = (entry, tile) => {
  return entry.position.equals(tile.position);
};

function App() {
  const dispatch = useDispatch();
  const s = useSelector((s) => s);

  const map = s.world
    .map((row) =>
      row
        .map(
          (tile) =>
            ({
              [tile.type === tileType.snow]: "❄️",
              [tile.type === tileType.tree]: "🌲️",
              [!!isOneOfAtTile(s.badKids, tile)]: "😈",
              [!!isOneOfAtTile(s.balls, tile)]: "⚪️",
              [isEntryAtTile(s.player, tile)]: "🙃",
            }[true])
        )
        .join("\t")
    )
    .join("\n");

  const { x, y } = s.player.position;

  const [facing] = Object.entries(direction).find(([, vec]) =>
    vec.equals(s.player.facing)
  );

  const pixelSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--pixel-size")
  );
  const camera_left = pixelSize * 66;
  const camera_top = pixelSize * 42;

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
      <div className="corner_topleft" />
      <div className="corner_topright" />
      <div className="corner_bottomleft" />
      <div className="corner_bottomright" />
      <div className="camera">
        <div
          key="map"
          className="map pixel-art"
          style={{
            transform: `translate3d( ${-x * 10 * pixelSize + camera_left}px, ${
              -y * 10 * pixelSize + camera_top
            }px, 0 )`,
          }}
        >
          {/*<div className="character" facing={facing} walking="true">*/}
          {/*  <div className="shadow pixel-art" />*/}
          {/*  <div className="character_spritesheet pixel-art" />*/}
          {/*</div>*/}
          <pre>
            <code>{map}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;
