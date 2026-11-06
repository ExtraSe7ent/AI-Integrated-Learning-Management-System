import { useDemo } from "../data/DemoProvider";
import { classesOf, coursesOf, lessonsOf } from "../data/scope";
import { useAccount } from "./AccountProvider";

/** The signed-in account's courses, classes and lessons, from the server's assignments. */
export function useScope() {
  const { data } = useDemo();
  const { account } = useAccount();
  return {
    viewer: account,
    courses: coursesOf(data, account),
    classes: classesOf(data, account),
    lessons: lessonsOf(data, account),
  };
}
