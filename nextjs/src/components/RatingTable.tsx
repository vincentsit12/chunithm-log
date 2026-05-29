import classNames from "classnames";
import _, { isNumber } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChunithmNetLogin,
  ChunithmVersion,
  CURRENT_VERSION,
  Rating,
  SortingKeys,
  TableHeader,
} from "types";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  Column,
  List,
  Table,
  WindowScroller,
} from "react-virtualized";
import { toFixedTrunc } from "utils/calculateRating";
import { useWindowResize } from "utils/hooks/useWindowResize";
import { GiMusicalScore } from "react-icons/gi";
import {
  BiSolidUpArrow,
  BiLogoYoutube,
  BiSolidDownArrow,
  BiListCheck,
  BiUpsideDown,
  BiCheck,
} from "react-icons/bi";
import { Listbox, Transition } from "@headlessui/react";
import ListBox from "./ListBox";
import DraggableList, { DropList } from "./DraggableList";
import Modal from "./Modal";
import { IoMdSettings, IoMdRefresh } from "react-icons/io";
import { Divider } from "./Divider";
import { Button } from "@/components/ui/Button";
import { useLocalStorage } from "utils/hooks/useLocalStorage";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useForm } from "react-hook-form";
import LoadingView from "./LoadingView";
import { useParams, usePathname, useSearchParams } from "next/navigation";

const defaultHideHeader: TableHeader[] = ["Youtube", "Grade"];
const defaultDisplayHeader: TableHeader[] = [
  "Rank",
  "Name",
  "Script",
  "Base",
  "Score",
  "Rate",
];
const levels = [
  { name: "All", value: 0 },
  { name: "15", value: 15 },
  { name: "14+", value: 14.5 },
  { name: "14", value: 14 },
  { name: "13+", value: 13.5 },
  { name: "13", value: 13 },
  { name: "12+", value: 12.5 },
  { name: "12", value: 12 },
  { name: "11+", value: 11.5 },
  { name: "11", value: 11 },
  { name: "10+", value: 10.5 },
  { name: "10", value: 10 },
];
const versions: { name: string; value: number }[] = [
  { name: "All", value: 0 },
  { name: "w/o Latest", value: 1 },
  { name: "Verse", value: 2 },
  { name: "Luminous Plus", value: 3 },
  { name: "Luminous", value: 4 },
  { name: "Sun Plus", value: 5 },
  { name: "Sun", value: 6 },
  { name: "New Plus", value: 7 },
  { name: "New", value: 8 },
  { name: "Paradise Lost", value: 9 },
  { name: "Paradise", value: 10 },
  { name: "Crystal Plus", value: 11 },
  { name: "Crystal", value: 12 },
  { name: "Amazon Plus", value: 13 },
  { name: "Amazon", value: 14 },
  { name: "Star Plus", value: 15 },
  { name: "Star", value: 16 },
  { name: "Air Plus", value: 17 },
  { name: "Air", value: 18 },
  { name: "Chunithm Plus", value: 19 },
  { name: "Chunithm", value: 20 },
];
const tableRowsNumbers = [
  { name: "All", value: -1 },
  { name: "30", value: 30 },
  { name: "100", value: 100 },
  { name: "200", value: 200 },
  { name: "500", value: 500 },
];
const cache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 42,
});

const difficultyBadgeClassName = (difficulty?: string) =>
  classNames(
    "flex h-7 w-[3.5rem] shrink-0 cursor-pointer items-center justify-center rounded-md text-sm font-semibold text-white shadow-sm",
    {
      "bg-master": difficulty === "master",
      "bg-expert": difficulty === "expert",
      "bg-ultima": difficulty === "ultima",
      "bg-red": difficulty === "red",
    },
  );

export const RecentRatingTable = ({
  recentRatingList,
  isOtherUser = false,
}: {
  recentRatingList: Rating[];
  isLoading?: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  isOtherUser?: boolean;
}) => {
  const [showTable, setShowTable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChunithmNetLogin>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const query = useSearchParams();
  const height = recentRatingList.length * 48;
  const updateRecord = async (chunithmNetLogin?: ChunithmNetLogin) => {
    setIsLoading(true);
    let body: ChunithmNetLogin | undefined = chunithmNetLogin;
    let url = "/api/record/remoteUpdate/" + session?.user.id;
    return axios
      .post(url, body)
      .then((res) => {
        router.reload();
      })
      .catch((e) => {
        setIsLoading(false);
        if (e.response.data.errorCode == 999) {
          setIsModalOpen(true);
        } else {
          alert(e.response.data.message);
        }
      });
  };
  const handleSubmitForm = handleSubmit(async (values) => {
    console.log(values);
    // setLoading(true)
    await updateRecord(values);
    setIsModalOpen(false);
  });

  const error: boolean =
    errors?.password?.type === "required" || errors?.sid?.type === "required";
  return (
    <div className="relative">
      {isLoading && (
        <div className="bg-black/40 z-[9999] fixed h-full w-full top-0 left-0 fadeIn">
          <LoadingView />
        </div>
      )}
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 form-check">
        <div aria-hidden="true" />
        <div className="flex min-w-0 items-center justify-center form-check">
          <input
            onChange={(e) => {
              setShowTable(e.target.checked);
            }}
            checked={showTable}
            id="recent"
            className="checkbox"
            type="checkbox"
          />
          <label
            className="ml-2 mr-2 text-sm font-medium text-slate-200"
            htmlFor="recent"
          >
            Recent Songs
          </label>
        </div>
        <div className="flex shrink-0 items-center justify-self-end">
          {!isOtherUser && (
            <Button
              onClick={async () => {
                await updateRecord();
              }}
              size="icon"
              variant="secondary"
            >
              <IoMdRefresh size={"1.25rem"} />
            </Button>
          )}
        </div>
      </div>
      <div
        className={
          "rating-table mb-5 box box-shadow !min-h-0 collapsable scrollbar-hide"
        }
        style={{ maxHeight: !showTable ? 0 : `${height}px` }}
      >
        {_.map(recentRatingList, (k, i) => {
          return (
            <div
              key={k.song + i}
              className="rating-table-row flex min-h-[42px] items-center gap-2 px-3 py-2 text-sm text-slate-100"
            >
              <span className="flex w-[3rem] shrink-0 items-center justify-center">
                {k.order ?? "-"}
              </span>
              <span className="min-w-0 flex-1 truncate px-2 text-left">
                {k.song}
              </span>
              {/* <span className='cursor-pointer w-[1.75rem] px-1'><BiLogoYoutube size={"100%"} /></span> */}
              {k.scriptUrl && (
                <Button
                  className="shrink-0 text-slate-200 hover:text-cyan-200"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    window.open(k.scriptUrl);
                  }}
                >
                  <GiMusicalScore size={"1rem"} />
                </Button>
              )}
              {!k.scriptUrl && (
                <span className="w-7 shrink-0" aria-hidden="true" />
              )}
              <span className="flex w-[3.5rem] shrink-0 items-center justify-center">
                {toFixedTrunc(k.internalRate, 1)}
              </span>
              <span className="flex w-[5.5rem] shrink-0 items-center justify-center">
                {k.score}
              </span>
              <span
                onClick={() => {
                  router.push(`/song/${k.song}`);
                }}
                className={difficultyBadgeClassName(k.difficulty)}
              >
                {k.truncatedRating}{" "}
              </span>
            </div>
          );
        })}
      </div>
      {!isOtherUser && (
        <Modal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          positiveBtnText={"Send"}
          showButton={false}
          closeModal={() => {
            setIsModalOpen(false);
          }}
        >
          <section className="px-5">
            {isLoading && <div className="w-full h-full absolute"></div>}
            <h4 className="text-left ml-1 bold">Chunithm Net Login</h4>
            <div className="tl my-2 ml-1 text-[0.75rem] text-slate-400">
              {
                "*We will not save your id/password, once the login session is expired, you may need to provide the login again for updating new record from our site."
              }
            </div>
            <Divider />
            <form onSubmit={handleSubmitForm} className="pt-4 pb-4">
              {error && (
                <div className="bold txt-secondary tl  font14">
                  Please check your username/password is input correctly.
                </div>
              )}
              <input
                {...register("sid", { required: true })}
                autoComplete="chu2-id"
                className="form-control !mb-4"
                type="text"
                placeholder={"Username"}
              ></input>
              <input
                {...register("password", { required: true })}
                autoComplete="chu2-password"
                className="form-control !mb-4"
                type="password"
                placeholder={"Password"}
              ></input>
              <Button
                type="button"
                className="m-1 sm:m-3"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  // e.preventDefault();
                  setIsModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="m-1 sm:m-3"
                size="sm"
                onClick={(e) => {}}
              >
                Submit
              </Button>

              {/* {loading &&
                        <div className='bg-black/40	 absolute h-full w-full top-0 left-0 fadeIn'>
                            <LoadingView />
                        </div>
                    } */}
            </form>
          </section>
        </Modal>
      )}
    </div>
  );
};

export const BestRatingTable = ({ ratingList }: { ratingList: Rating[] }) => {
  const [itemList, setItemList] = useLocalStorage<DropList>(
    {
      notSelected: defaultHideHeader,
      selected: defaultDisplayHeader,
    },
    "headerPref",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 1010000]);

  const [selectedLevel, setSelectedLevel] = useState(levels[0]);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const [selectedTableRowsNumber, setSelectedTableRowsNumber] = useState(
    tableRowsNumbers[3],
  );
  const tableRowsNumber = selectedTableRowsNumber.value;
  const [sortingPref, setSortingPref] = useState<[SortingKeys, "asc" | "desc"]>(
    ["rating", "desc"],
  );
  const sortedRatingList = useMemo(() => {
    let orderedList: Rating[];
    const scoreRule = (score: number) => {
      return score >= scoreRange[0] && score <= scoreRange[1];
    };

    if (selectedLevel.value > 0) {
      orderedList = ratingList.filter(
        (k) =>
          scoreRule(k.score) &&
          k.internalRate >= selectedLevel.value &&
          k.internalRate < selectedLevel.value + 0.5,
      );
    } else {
      orderedList = ratingList.filter((k) => scoreRule(k.score));
    }

    if (selectedVersion.value == 1) {
      orderedList = orderedList.filter((k) => k.version != CURRENT_VERSION);
    } else if (selectedVersion.value > 0) {
      orderedList = orderedList.filter(
        (k) => k.version == selectedVersion.name,
      );
    }

    if (sortingPref[0] === "rating") {
      orderedList = _.orderBy(orderedList, ["rating"], [sortingPref[1]]);
    } else {
      orderedList = _.orderBy(
        orderedList,
        [sortingPref[0], "rating"],
        [sortingPref[1], "desc"],
      );
    }
    if (searchText)
      return _.filter(orderedList, (k) => {
        if (parseFloat(searchText) > 0.0) {
          let searchRate = parseFloat(searchText);
          return (
            k.song.toUpperCase().includes(searchText.toUpperCase()) ||
            k.internalRate === searchRate
          );
        } else return k.song.toUpperCase().includes(searchText.toUpperCase());
      });
    else return orderedList;
  }, [
    searchText,
    sortingPref,
    selectedLevel,
    scoreRange,
    ratingList,
    selectedVersion,
  ]);

  const updatedIdSet = useMemo(() => {
    const set = new Set<number>();
    const grp = _.groupBy(ratingList, (o) => {
      return o.updatedAt;
    });
    const keyGrp = Object.keys(grp);
    if (keyGrp.length <= 1) return set;
    //filter out the first update
    const orderedKey = _.tail(_.sortBy(keyGrp));

    let count = 0;
    const max = 15;
    for (let i = orderedKey.length - 1; i >= 0; i--) {
      if (count < max) {
        for (let j = 0; j < grp[orderedKey[i]].length; j++) {
          let id = grp[orderedKey[i]][j].order ?? -1;
          if (id > 0) {
            set.add(id);
          }
          count++;
        }
      } else break;
    }

    return set;
  }, [ratingList]);

  const Table = () => {
    const _renderArrow = (key: SortingKeys) => {
      return key === sortingPref[0] ? (
        <span
          className={classNames("ml-1 rotate", {
            "rotate-0": sortingPref[1] == "asc",
            "rotate-180": sortingPref[1] == "desc",
          })}
        >
          <BiSolidUpArrow size={".75rem"} />
        </span>
      ) : null;
    };
    const changeSortingPref = (key: SortingKeys) => {
      let opposite: "desc" | "asc" = sortingPref[1] === "asc" ? "desc" : "asc";
      if (key == sortingPref[0]) {
        setSortingPref([key, opposite]);
      } else {
        setSortingPref([key, "desc"]);
      }
    };
    const tableRowsNum =
      tableRowsNumber < 0 ? sortedRatingList.length : tableRowsNumber;
    const _renderHeader = (key: TableHeader, index: number) => {
      switch (key) {
        case "Base":
          return (
            <div
              key={key + index}
              onClick={() => {
                changeSortingPref("internalRate");
              }}
              className="flex w-[3.25rem] shrink-0 items-center justify-center"
            >
              {"Base"}
              {_renderArrow("internalRate")}
            </div>
          );
        case "Youtube":
          return <div key={key + index} className="w-[2rem] shrink-0"></div>;
        case "Script":
          return <div key={key + index} className="w-[2rem] shrink-0"></div>;
        case "Name":
          return (
            <div
              key={key + index}
              onClick={() => {
                changeSortingPref("song");
              }}
              className="flex min-w-0 flex-1 items-center px-2 text-left"
            >
              {"Name"}
              {_renderArrow("song")}
            </div>
          );
        case "Rank":
          return (
            <div
              key={key + index}
              onClick={() => {
                changeSortingPref("order");
              }}
              className="flex w-[3.25rem] shrink-0 items-center justify-center"
            >
              {"Rank"}
              {_renderArrow("order")}
            </div>
          );
        case "Rate":
          return (
            <div
              key={key + index}
              onClick={() => {
                changeSortingPref("rating");
              }}
              className="flex w-[3.25rem] shrink-0 items-center justify-center"
            >
              {"Rate"}
              {_renderArrow("rating")}
            </div>
          );

        case "Grade":
          return (
            <div
              key={key + index}
              onClick={() => {
                changeSortingPref("grade");
              }}
              className="flex w-[4rem] shrink-0 items-center justify-center"
            >
              {"Grade"}
              {_renderArrow("grade")}
            </div>
          );
        case "Score":
          return (
            <div
              key={key + index}
              onClick={() => {
                changeSortingPref("score");
              }}
              className="flex w-[5.5rem] shrink-0 items-center justify-center"
            >
              {"Score"}
              {_renderArrow("score")}
            </div>
          );
      }
    };

    const _renderContent = (key: TableHeader, data: Rating, index: number) => {
      switch (key) {
        case "Base":
          return (
            <span
              key={key + index}
              className="flex w-[3.25rem] shrink-0 items-center justify-center"
            >
              {toFixedTrunc(data.internalRate, 1)}
            </span>
          );

        case "Youtube":
          return (
            <span
              key={key + index}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-200 transition hover:bg-white/10 hover:text-cyan-200"
              onClick={() => {
                window.open(
                  `https://www.youtube.com/results?search_query=${data.song}+${data.difficulty}+chunithm`,
                );
              }}
            >
              <BiLogoYoutube className="mx-auto" size={"1rem"} />
            </span>
          );
        case "Script":
          return data.scriptUrl ? (
            <span
              key={key + index}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-200 transition hover:bg-white/10 hover:text-cyan-200"
              onClick={() => {
                window.open(data.scriptUrl);
              }}
            >
              <GiMusicalScore className="mx-auto" size={"1rem"} />
            </span>
          ) : (
            <span
              key={key + index}
              className="w-7 shrink-0"
              aria-hidden="true"
            />
          );
        case "Name":
          return (
            <span
              key={key + index}
              className="min-w-0 flex-1 truncate px-2 text-left"
            >
              {data.song}
            </span>
          );

        case "Rank":
          return (
            <span
              key={key + index}
              className="flex w-[3.25rem] shrink-0 items-center justify-center"
            >
              {data.order ?? "-"}
            </span>
          );

        case "Rate":
          return (
            <span
              key={key + index}
              onClick={() => {
                router.push(`/song/${data.song}`);
              }}
              className={difficultyBadgeClassName(data.difficulty)}
            >
              {data.truncatedRating}{" "}
            </span>
          );

        case "Grade":
          return (
            <span
              key={key + index}
              className="flex w-[4rem] shrink-0 items-center justify-center"
            >
              {data.grade}
            </span>
          );
        case "Score":
          return (
            <span
              key={key + index}
              className="flex w-[5.5rem] shrink-0 items-center justify-center"
            >{`${data.score}`}</span>
          );
      }
    };
    return (
      <>
        <div className="rating-table-header flex min-h-[44px] items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          {itemList.selected.map((k, i) => {
            return _renderHeader(k, i);
          })}
          {/* {updatedIdSet.has(k.order ?? -1) && <span className="ml-2 txt-red">▲</span>} */}
        </div>
        {_.map(_.take(sortedRatingList, tableRowsNum), (k, i) => {
          const showTop30Border =
            i === 29 &&
            !searchText &&
            (tableRowsNumber > 30 || tableRowsNumber < 0) &&
            _.isEqual(sortingPref, ["rating", "desc"]) &&
            _.isEqual(scoreRange, [0, 1010000]) &&
            selectedLevel.name == "All";
          return (
            <div
              key={k.song + k.order}
              className={classNames(
                "rating-table-row flex min-h-[42px] items-center gap-2 px-3 py-2 text-sm text-slate-100",
                {
                  "border-b border-b-red-700": showTop30Border,
                },
              )}
            >
              {itemList.selected.map((key, index) =>
                _renderContent(key, k, index),
              )}
              {updatedIdSet.has(k.order ?? -1) && (
                <span className="ml-2 txt-red">▲</span>
              )}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <>
      <input
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
        }}
        className="p-6 box box-shadow mb20 w-full h-10"
        placeholder="Song Title / Base Rate"
      ></input>

      <div className="mb-4 flex items-center justify-between text-slate-200">
        <div className="flex flex-wrap items-center justify-around form-check">
          <div className="flex items-center m-2">
            <span className="text-sm font-medium text-slate-200">
              No. of rows:
            </span>
            <ListBox
              className="w-[5rem] ml-2"
              source={tableRowsNumbers}
              selected={selectedTableRowsNumber}
              setSelected={setSelectedTableRowsNumber}
            />
          </div>
          <div className="flex items-center m-2">
            <span className="text-sm font-medium text-slate-200">
              Versions:
            </span>
            <ListBox
              className="w-[8rem] ml-2"
              source={versions}
              selected={selectedVersion}
              setSelected={setSelectedVersion}
            />
          </div>
          <div className="flex items-center m-2">
            <span className="text-sm font-medium text-slate-200">Levels:</span>
            <ListBox
              className="w-[5rem] ml-2"
              source={levels}
              selected={selectedLevel}
              setSelected={setSelectedLevel}
            />
          </div>
        </div>
        <div>
          <Button
            onClick={() => {
              setIsModalOpen(true);
            }}
            size="icon"
            variant="secondary"
          >
            <IoMdSettings size={"1.25rem"} />
          </Button>
        </div>
      </div>

      <div className="rating-table box box-shadow">
        {ratingList.length > 0 ? (
          <Table />
        ) : (
          <div className="inner-p20 w-full h-full text-left">
            <p className="mb10">
              {`1. Save the above script into a browser bookmark`}
            </p>
            <p className="mb10">
              {`2. Open this page (required login) `}
              <Link href={"https://chunithm-net-eng.com/mobile/home/"}>
                https://chunithm-net-eng.com/mobile/home/
              </Link>
            </p>
            <p className="mb10">
              {`3. click the bookmark and wait for redirecting to this page`}
            </p>
          </div>
        )}
      </div>
      <SettingModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        itemList={itemList}
        setItemList={setItemList}
        scoreRange={scoreRange}
        setScoreRange={setScoreRange}
      />
    </>
  );
};

const SettingModal = ({
  isModalOpen,
  setIsModalOpen,
  itemList,
  setItemList,
  scoreRange,
  setScoreRange,
}: {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  itemList: DropList;
  setItemList: (value: DropList) => void;
  scoreRange: [number, number];
  setScoreRange: Dispatch<SetStateAction<[number, number]>>;
}) => {
  const [tempItemList, setTempItemList] = useState<DropList>({
    notSelected: itemList["notSelected"],
    selected: itemList["selected"],
  });
  const [tempScoreRange, setTempScoreRange] =
    useState<[number, number]>(scoreRange);

  useEffect(() => {
    setTempItemList(itemList);
    setTempScoreRange(scoreRange);
  }, [itemList, scoreRange]);

  return (
    <Modal
      isOpen={isModalOpen}
      setIsOpen={setIsModalOpen}
      rightBtnCallBack={() => {
        setItemList(tempItemList);
        let scoreRange: any = [...tempScoreRange];
        if (isNaN(parseInt(scoreRange[0]))) {
          scoreRange[0] = 0;
        } else if (parseInt(scoreRange[0]) > parseInt(scoreRange[1])) {
          scoreRange[0] = parseInt(scoreRange[1]);
        }
        if (isNaN(parseInt(scoreRange[1]))) {
          scoreRange[1] = 1010000;
        } else if (parseInt(scoreRange[0]) > parseInt(scoreRange[1])) {
          scoreRange[1] = parseInt(scoreRange[0]);
        }
        setScoreRange(scoreRange);
        setIsModalOpen(false);
      }}
      closeModal={() => {
        setTempItemList(itemList);
        setTempScoreRange(scoreRange);
        setIsModalOpen(false);
      }}
    >
      <section className="p-5">
        <h4 className="text-left ml-1 bold">Score Range</h4>
        <Divider />
        <div className="flex justify-between items-center p-2">
          <input
            autoFocus={false}
            value={tempScoreRange[0]}
            onChange={(e) => {
              let number = parseInt(e.target.value);
              if (!isNaN(number)) {
                // if (number > scoreRange[1]) number = scoreRange[1]
                setTempScoreRange((p) => [number, p[1]]);
              } else {
                setTempScoreRange((p) => [e.target.value as any, p[1]]);
              }
            }}
            className="p-6 box box-shado w-full h-10"
            inputMode="numeric"
            placeholder="0"
          ></input>

          <span className="text-lg mx-2 bold"> ー </span>

          <input
            autoFocus={false}
            value={tempScoreRange[1]}
            inputMode="numeric"
            onChange={(e) => {
              let number = parseInt(e.target.value);
              if (!isNaN(number)) {
                // if (number < scoreRange[0]) number = scoreRange[0]
                setTempScoreRange((p) => [p[0], number]);
              } else {
                setTempScoreRange((p) => [p[0], e.target.value as any]);
              }
            }}
            className="p-6 box w-full h-10"
            placeholder="1010000"
          ></input>
        </div>
      </section>
      <section className="p-5">
        <h4 className="text-left ml-1 bold">Header</h4>
        <Divider />
        <DraggableList setItemList={setTempItemList} itemList={tempItemList} />
      </section>
    </Modal>
  );
};
