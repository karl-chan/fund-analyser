use ndarray::parallel::prelude::*;
use ndarray::prelude::*;
use ndarray::{Array, Array1, Array2, ArrayView1, ArrayView2};
use numpy::{IntoPyArray, PyArray2};
use pyo3::prelude::{pymodule, PyModule, PyResult, Python};
use pyo3::types::PyTuple;

#[pymodule]
fn rust_indicators(_py: Python, m: &PyModule) -> PyResult<()> {
    fn support_resistance_ilocs(
        prices_df: ArrayView2<f64>,
    ) -> (Array2<Option<usize>>, Array2<Option<usize>>) {
        let dim = prices_df.raw_dim();
        let (support_ilocs_vecs, resistance_ilocs_vecs) = prices_df
            .outer_iter()
            .into_par_iter()
            .map(support_resistance_series_ilocs)
            .unzip();
        (
            unnest(support_ilocs_vecs, dim),
            unnest(resistance_ilocs_vecs, dim),
        )
    }

    fn support_resistance_series_ilocs(
        prices_series: ArrayView1<f64>,
    ) -> (Array1<Option<usize>>, Array1<Option<usize>>) {
        let mut support_ilocs: Array1<Option<usize>> = Array::default(prices_series.raw_dim());
        let mut resistance_ilocs: Array1<Option<usize>> = Array::default(prices_series.raw_dim());

        let mut support_turning_points: Vec<TurningPoint> = Vec::new();
        let mut resistance_turning_points: Vec<TurningPoint> = Vec::new();
        let mut prev_direction = Direction::Flat;

        #[derive(PartialEq)]
        enum Direction {
            Flat,
            Up,
            Down,
        }
        struct TurningPoint {
            iloc: usize,
            price: f64,
        }
        fn get_direction(prev_price: f64, price: f64) -> Direction {
            match price {
                _ if prev_price < price => Direction::Up,
                _ if prev_price > price => Direction::Down,
                _ => Direction::Flat,
            }
        }
        fn get_prev_support_iloc(
            prev_price: f64,
            support_turning_points: &Vec<TurningPoint>,
        ) -> Option<usize> {
            support_turning_points
                .iter()
                .rfind(|tp| tp.price < prev_price)
                .map(|tp| tp.iloc)
        }
        fn get_prev_resistance_iloc(
            prev_price: f64,
            resistance_turning_points: &Vec<TurningPoint>,
        ) -> Option<usize> {
            resistance_turning_points
                .iter()
                .rfind(|tp| tp.price > prev_price)
                .map(|tp| tp.iloc)
        }

        for iloc in 1..prices_series.len() {
            let prev_iloc = iloc - 1;
            let (prev_price, price) = (prices_series[iloc - 1], prices_series[iloc]);
            let direction = get_direction(prev_price, price);

            // find last seen support / resistance
            support_ilocs[prev_iloc] = get_prev_support_iloc(prev_price, &support_turning_points);
            resistance_ilocs[prev_iloc] =
                get_prev_resistance_iloc(prev_price, &resistance_turning_points);

            // update seen supports and resistances (expanding window)
            match direction {
                Direction::Up if prev_direction == Direction::Down => {
                    support_turning_points.push(TurningPoint {
                        iloc: prev_iloc,
                        price: prev_price,
                    })
                }
                Direction::Down if prev_direction == Direction::Up => resistance_turning_points
                    .push(TurningPoint {
                        iloc: prev_iloc,
                        price: prev_price,
                    }),
                _ => {}
            }
            if direction != Direction::Flat {
                prev_direction = direction;
            }
        }

        // Need to handle last date after loop
        let last_iloc = prices_series.len() - 1;
        let last_price = prices_series[last_iloc];
        support_ilocs[last_iloc] = get_prev_support_iloc(last_price, &support_turning_points);
        resistance_ilocs[last_iloc] =
            get_prev_resistance_iloc(last_price, &resistance_turning_points);
        (support_ilocs, resistance_ilocs)
    }

    fn unnest<T: Clone>(vec: Vec<Array1<T>>, shape: Dim<[usize; 2]>) -> Array2<T> {
        Array::from_iter(vec.iter().flatten().cloned())
            .into_shape(shape)
            .unwrap()
    }

    fn default_to_nan(arr: Array2<Option<usize>>) -> Array2<f64> {
        arr.map(|e| e.map_or(f64::NAN, |v| v as f64))
    }

    #[pyfn(m)]
    #[pyo3(name = "support_resistance_ilocs")]
    fn support_resistance_ilocs_py<'p>(py: Python<'p>, prices_df: &PyArray2<f64>) -> &'p PyTuple {
        let prices_df = unsafe { prices_df.as_array() };
        let (support_ilocs, resistance_ilocs) = support_resistance_ilocs(prices_df);
        PyTuple::new(
            py,
            &[
                default_to_nan(support_ilocs).into_pyarray(py).to_owned(),
                default_to_nan(resistance_ilocs).into_pyarray(py).to_owned(),
            ],
        )
    }

    Ok(())
}
