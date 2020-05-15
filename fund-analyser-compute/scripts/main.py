import argparse
import sys
import traceback

from lib.util.logging_utils import log_error, log_info
from lib.util.stopwatch import Stopwatch
from scripts.tasks.update_similar_funds import update_similar_funds

TASKS = {
    "updateSimilarFunds": update_similar_funds
}


def main():
    operations = ",".join(TASKS.keys())

    parser = argparse.ArgumentParser(description="Specify tasks to run.")
    parser.add_argument("-r", "--run", metavar="tasks", choices=TASKS.keys(), nargs="+", required=True,
                        help=f"specify one or more of the following tasks: {operations}")
    args = parser.parse_args()

    log_info(f"Received instructions to run: {args.run}")
    timer = Stopwatch()

    for task in args.run:
        log_info(f"Started running: {task}")
        try:
            TASKS[task]()
        except Exception:
            exc_type, exc_value, exc_traceback = sys.exc_info()

            task_duration = timer.split()
            log_error(f"Error during {task}:\n"
                      f"{''.join(traceback.format_exception_only(exc_type, exc_value))}\n"
                      f" after {task_duration}.")

            overall_duration = timer.end()
            log_error(
                f"Aborted due to error:\n"
                f"{''.join(traceback.format_exception(exc_type, exc_value, exc_traceback))}\n"
                f" after {overall_duration}.")
            exit(1)

        task_duration = timer.split()
        log_info(f"Completed: {task} in {task_duration}.")

    overall_duration = timer.end()
    log_info(f"Successfully completed all operations: {args.run} in {overall_duration}.")
    exit()


if __name__ == "__main__":
    main()
