import type { NextPage, NextPageContext } from "next";
import { getSession } from "next-auth/react";
import { CURRENT_VERSION, Rating, Song } from "types";
import _, { isString } from "lodash";
import Users from "db/model/users";
import Records from "db/model/records";
import Songs from "db/model/songs";
import { MdOutlineContentCopy } from "react-icons/md";
import { MdOutlineGames } from "react-icons/md";
import {
  calculateSingleSongRating,
  generateScript,
  toFixedTrunc,
} from "utils/calculateRating";
import { CopyToClipboard } from "react-copy-to-clipboard";
import LayoutWrapper from "components/LayoutWrapper";
import { SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { decrypt } from "utils/encrypt";
import Tooltip from "rc-tooltip";
import "rc-tooltip/assets/bootstrap_white.css";
import { BestRatingTable, RecentRatingTable } from "components/RatingTable";
import { getRatingList } from "utils/getRatingList";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";

type Props = {
  bestRatingList: Rating[];
  recentRatingList: Rating[];
  userId: string;
  userName?: string;
};

// const RecommadSongs = ({ avg }: { avg: number }) => {
//   const [list, setList] = useState<Songs[]>([])
//   const [isLoading, setIsLoading] = useState(false)

//   useEffect(() => {
//     let upper = Math.max(avg + 0.1 - 2.15, 10)
//     let lower = Math.max(avg - 2.15, 0)
//     getRecommandList(lower, upper).then(d => {
//       setList(d.data)
//     }).catch((e) => {

//     })

//   }, [])

//   return <ul>
//     {_.map(list, (k, i) => {
//       return <li>
//         {`${i}. ${k.display_name} ${k.id}}`}
//       </li>
//     })}
//   </ul>
// }
const UserScript = ({ userId }: { userId: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<NodeJS.Timeout>();
  return (
    <CopyToClipboard text={generateScript(userId)}>
      <Tooltip
        onVisibleChange={(visible) => {
          if (visible) {
            timer.current = setTimeout(() => {
              setCopied(false);
            }, 3000);
          }
        }}
        visible={copied}
        overlayClassName={"fadeIn"}
        showArrow={false}
        overlayStyle={{ width: "6rem", textAlign: "center" }}
        placement="top"
        trigger={["click"]}
        overlay={<span>Copied</span>}
      >
        <Button
          onClick={() => {
            if (copied && timer.current) {
              clearTimeout(timer.current);
              timer.current = setTimeout(() => {
                setCopied(false);
              }, 3000);
            } else setCopied(true);
          }}
          className="text-white"
          size="icon"
          variant="secondary"
        >
          <MdOutlineContentCopy size={"1.25rem"} />
        </Button>
      </Tooltip>
    </CopyToClipboard>
  );
};
const Home: NextPage<Props> = ({
  bestRatingList,
  recentRatingList,
  userId,
  userName,
}) => {
  const [average, recentAverage, recent] = useMemo(() => {
    const additions = 0.00000001;
    let recentRatingListSongName: Set<string> = new Set();
    recentRatingList.forEach((k) => {
      recentRatingListSongName.add(k.song);
    });
    const top30 = _.take(
      _.orderBy(bestRatingList, ["rating"], ["desc"]).filter((k) => {
        if (k.version != CURRENT_VERSION) {
          return true;
        } else {
          if (recentRatingListSongName.has(k.song)) {
            return false;
          } else {
            return true;
          }
        }
      }),
      30,
    );
    const top30Total = top30.reduce((a: number, b: Rating) => a + b.rating, 0);
    const top30Avg = top30Total / 30 + additions;
    const recentTotal = recentRatingList.reduce(
      (a: number, b: Rating) => a + b.rating,
      0,
    );
    const recentAvg =
      recentRatingList.length > 0 ? recentTotal / 20 + additions : 0;
    const recent = (top30Total + recentTotal) / 50 + additions;
    return [top30Avg, recentAvg, recent];
  }, [bestRatingList, recentRatingList]);

  const router = useRouter();
  return (
    <LayoutWrapper>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-center">
        {userName && (
          <h1 className="text-3xl font-bold text-white">{`User: ${userName}`}</h1>
        )}
        <Surface className="flex flex-col items-center gap-4 px-5 py-5 text-left sm:flex-row sm:justify-between">
          <div
            id="script"
            className="min-w-0 flex-1 rounded-[1.5rem] bg-white/5 px-4 py-3 text-sm text-slate-200 ring-1 ring-white/10"
          >
            <p className="break-all"> {generateScript(userId)}</p>
          </div>
          <UserScript userId={userId} />
        </Surface>

        <Surface className="px-6 py-5">
          <div className="space-x-5 text-lg font-semibold text-white">
            <span>{`Top 30 Average : ${toFixedTrunc(average, 4)}`}</span>
          </div>
          <div className="mt-2 space-x-5 text-sm text-slate-300 sm:text-base">
            <span>{`Recent : ${toFixedTrunc(recentAverage, 2)}`}</span>
            <span>{`Now : ${toFixedTrunc(recent, 2)}`}</span>
          </div>
        </Surface>

        <RecentRatingTable recentRatingList={recentRatingList} />

        <BestRatingTable ratingList={bestRatingList} />
      </div>
    </LayoutWrapper>
  );
};

export default Home;

export async function getServerSideProps(context: NextPageContext) {
  context.res?.setHeader("Cache-Control", "public, s-maxage=10");
  try {
    let session = await getSession(context);
    if (!session)
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    const encryptUserId = session.user.id.toString();

    const userID = decrypt(encryptUserId);

    let data = await Users.findOne({
      where: { id: parseInt(userID) },
      include: {
        model: Records,
        include: [
          {
            model: Songs,
            where: {
              is_deleted: false,
            },
          },
        ],
      },
    });

    const [bestRatingList, recentRatingList] = await getRatingList(data);

    // let average = _.take(ratingList, 30).reduce((a: number, b: Rating) => a + b.rating, 0) / 30
    return {
      props: {
        bestRatingList,
        recentRatingList,
        // average
        userId: encryptUserId,
        userName: data?.username ?? "",
      },
    };
  } catch (e) {
    console.log(e);
    return {
      props: {
        ratingList: [] as Rating[],
      },
    };
  }
}
