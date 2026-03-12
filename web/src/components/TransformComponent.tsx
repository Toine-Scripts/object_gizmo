import { Suspense, useRef, useState, useEffect } from "react";
import { TransformControls } from "@react-three/drei";
import { useNuiEvent, fetchNui } from "../nui-events";
import { Mesh, MathUtils } from "three";

export const TransformComponent = () => {
  const mesh = useRef<Mesh>(null!);
  const [currentEntity, setCurrentEntity] = useState<number>();
  const [isEntityObject, setIsEntityObject] = useState<boolean>(true);

  const lastTimeCurrentEntitySet = useRef<number>();
  const altWasPressedOnOpen = useRef<boolean>(false);
  const altHasBeenReleased = useRef<boolean>(false);

  const [editorMode, setEditorMode] = useState<
    "translate" | "rotate" | undefined
  >("translate");
  const [space, setSpace] = useState<"world" | "local">("world");

  const handleObjectDataUpdate = () => {
    const zOffset = isEntityObject ? 0.5 : 0;
    
    // Pour les peds, on utilise une rotation simplifiée (heading only)
    let rotation;
    let position;
    
    if (isEntityObject) {
      // Conversion pour les objects (3 axes de rotation, conversions normales)
      rotation = {
        x: MathUtils.radToDeg(mesh.current.rotation.x),
        y: MathUtils.radToDeg(-mesh.current.rotation.z),
        z: MathUtils.radToDeg(mesh.current.rotation.y),
      };
      position = {
        x: mesh.current.position.x,
        y: -mesh.current.position.z,
        z: mesh.current.position.y - zOffset,
      };
    } else {
      // Pour les peds : heading only et conversions simples
      rotation = {
        x: 0,
        y: 0,
        z: MathUtils.radToDeg(mesh.current.rotation.y),
      };
      // Conversions pour les peds avec correction -1 sur Z (pour éviter le saut de +1)
      position = {
        x: mesh.current.position.x,
        y: -mesh.current.position.z,
        z: mesh.current.position.y - 1.0,
      };
    }
    
    const entity = {
      handle: currentEntity,
      position: position,
      rotation: rotation,
      isObject: isEntityObject,
    };
    fetchNui("moveEntity", entity);
  };

  useNuiEvent("setGizmoEntity", (entity: any) => {
    lastTimeCurrentEntitySet.current = Date.now();
    setCurrentEntity(entity.handle);
    setIsEntityObject(entity.isObject !== undefined ? entity.isObject : true);
    
    // Réinitialiser les flags Alt lors de l'ouverture d'une nouvelle entité
    if (entity.handle) {
      // On considère qu'Alt pourrait être appuyé, le premier keyup nous le dira
      altWasPressedOnOpen.current = true;
      altHasBeenReleased.current = false;
    }
    
    if (!entity.handle) {
      return;
    }

    const zOffset = (entity.isObject !== undefined ? entity.isObject : true) ? 0.5 : 0;
    const isObject = entity.isObject !== undefined ? entity.isObject : true;
    
    // Différencier les conversions de position selon le type d'entité
    if (isObject) {
      // Conversions pour les objects
      mesh.current.position.set(
        entity.position.x,
        entity.position.z + zOffset,
        -entity.position.y
      );
    } else {
      // Conversions standard pour les peds (sans décalage)
      mesh.current.position.set(
        entity.position.x,
        entity.position.z,
        -entity.position.y
      );
    }
    
    mesh.current.rotation.order = "YZX";
    
    // Appliquer différentes conversions de rotation selon le type d'entité
    if (isObject) {
      // Conversion pour les objects (3 axes)
      mesh.current.rotation.set(
        MathUtils.degToRad(entity.rotation.x),
        MathUtils.degToRad(entity.rotation.z),
        MathUtils.degToRad(entity.rotation.y)
      );
    } else {
      // Pour les peds, uniquement le heading (rotation Y du mesh)
      mesh.current.rotation.set(
        0,
        MathUtils.degToRad(entity.rotation.z),
        0
      );
    }
  });

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      // Si une touche autre que Alt est pressée, on sait qu'Alt n'était pas déjà appuyé
      if (e.code !== "AltLeft" && altWasPressedOnOpen.current && !altHasBeenReleased.current) {
        altWasPressedOnOpen.current = false;
        altHasBeenReleased.current = true;
      }
      
      if (e.code === "AltLeft") {
        // Si Alt n'a pas encore été relâché depuis l'ouverture
        if (altWasPressedOnOpen.current && !altHasBeenReleased.current) {
          // Ne rien faire, on attend le relâchement
          return;
        }
      }
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyR":
          if (editorMode == "rotate") return;
          setEditorMode("rotate");
          fetchNui("swapMode", { mode: "Rotate", space: space });
          break;
        case "KeyW":
          if (editorMode == "translate") return;
          setEditorMode("translate");
          fetchNui("swapMode", { mode: "Translate", space: space });
          break;
        case "KeyQ":
          const newSpace = space === "world" ? "local" : "world";
          setSpace(newSpace);
          fetchNui("swapMode", { mode: editorMode === "translate" ? "Translate" : "Rotate", space: newSpace });
          break;
        case "AltLeft":
          fetchNui("placeOnGround", { handle: currentEntity });
          break;
        case "Enter":
          if (!lastTimeCurrentEntitySet.current || Date.now() - lastTimeCurrentEntitySet.current < 500) return;
          fetchNui("finishEdit");
          break;
        case "KeyG":
          fetchNui("toggleCamera");
          break;
        default:
          break;
      }
    };
    
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    return () => {
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
    };
  });

  return (
    <>
      <Suspense fallback={<p>Chargement du Gizmo</p>}>
        {currentEntity != null && (
          <TransformControls
            size={0.5}
            object={mesh}
            mode={editorMode}
            space={space}
            onObjectChange={handleObjectDataUpdate}
            onMouseUp={() => fetchNui("recenterCamera")}
            showX={editorMode === "translate" || isEntityObject}
            showY={true}
            showZ={editorMode === "translate" || isEntityObject}
          />
        )}
        <mesh ref={mesh} />
      </Suspense>
    </>
  );
};
