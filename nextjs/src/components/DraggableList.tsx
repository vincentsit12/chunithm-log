import { DragDropContext, Droppable, Draggable, DropResult, DraggableLocation, resetServerContext } from "react-beautiful-dnd";
import Image from 'next/image'
import React, { Dispatch, SetStateAction, useEffect } from 'react'
import { BiSolidUpArrow, BiLogoYoutube } from "react-icons/bi";
import { TableHeader } from "types";
import { GiMusicalScore } from "react-icons/gi";

type Props = {
    itemList: DropList,
    setItemList: Dispatch<SetStateAction<DropList>>
}
export type DropList = { notSelected: TableHeader[], selected: TableHeader[] }

export default function DraggableList({ itemList, setItemList }: Props) {
    useEffect(() => {
        resetServerContext();
    }, [])

    const renderItem = (item: TableHeader) => {
        switch (item) {
            case "Youtube":
                return <BiLogoYoutube size={"1.25rem"} />
            case "Script":
                return <GiMusicalScore size={"1.25rem"} />
            default:
                return item;
        }
    }

    const move = (source: TableHeader[], destination: TableHeader[], droppableSource: DraggableLocation, droppableDestination: DraggableLocation) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);

        destClone.splice(droppableDestination.index, 0, removed);

        let result: DropList = {
            notSelected: [],
            selected: []
        }
        result[getID(droppableSource.droppableId)] = sourceClone;
        result[getID(droppableDestination.droppableId)] = destClone;

        return result;
    };
    const reorder = (list: TableHeader[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                itemList[getID(source.droppableId)],
                source.index,
                destination.index
            );

            if (source.droppableId === 'droppable2') {
                setItemList(list => {
                    return { ...list, selected: items }
                })
            }
            else {

                if (source.droppableId === 'droppable') {
                    setItemList(list => {
                        return { ...list, notSelected: items }
                    })
                }
            }
        } else {
            const result = move(
                itemList[getID(source.droppableId)],
                itemList[getID(destination.droppableId)],
                source,
                destination
            );

            setItemList(_list => {
                return {
                    notSelected: result.notSelected,
                    selected: result.selected
                }
            })

        }
    };
    const getID = (id: string) => {
        if (id == "droppable") {
            return "notSelected"
        }
        return "selected"
    }
    return (
        <DragDropContext onDragEnd={onDragEnd} >
            <Droppable droppableId="droppable" direction="horizontal"
                renderClone={(provided, snapshot, rubric) => (
                    <div
                        className="item-container"
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                    >
                        {renderItem(itemList["notSelected"][rubric.source.index])}
                    </div>
                )}
            >
                {(provided) => (
                    <div>
                    <h5 className="text-left ml-2">Hide</h5>
                        <div
                            className="list-container  mb-2"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {itemList['notSelected'].map((item, index) => (
                                <Draggable key={item} draggableId={item} index={index}>
                                    {(provided) => (
                                        <div
                                            className="item-container"
                                            ref={provided.innerRef}
                                            {...provided.dragHandleProps}
                                            {...provided.draggableProps}
                                        >
                                            {renderItem(item)}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
            <Droppable droppableId="droppable2" direction="horizontal" renderClone={(provided, snapshot, rubric) => (
                <div
                    className="item-container"
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                >
                    {renderItem(itemList["selected"][rubric.source.index])}
                </div>
            )}>
                {(provided) => (
                    <div>
                        <h5 className="text-left ml-2">Display</h5>

                        <div
                            className="list-container"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {itemList['selected'].map((item, index) => (
                                <Draggable key={item} draggableId={item} index={index}>
                                    {(provided) => (
                                        <div
                                            className="item-container"
                                            ref={provided.innerRef}
                                            {...provided.dragHandleProps}
                                            {...provided.draggableProps}
                                        >
                                            {renderItem(item)}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
}
