import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Chip, LinearProgress, ListItem, Paper, Stack } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/router';

import { defaultValues } from '@/constants';
import { addProduct, ReducerType, restAddProduct } from '@/global-states';
import { _productPrototypeReducerState as ReducerState, ProductType } from '@/types';
import { addProductSchemaValidation } from '@/utils';
import { createParams, filePath, s3 } from '@/utils/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { useDropzone } from 'react-dropzone';

// props from connect mapDispatchToProps
interface MapDispatchProps {
  addProduct: (finalData: any) => void;
  restAddProduct: () => void;
}

// props from connect mapStateToProps
interface MapStateProps {
  productsState: ReducerState;
}

type PropsType = MapDispatchProps & MapStateProps;

export function AddProductComponent({ addProduct, restAddProduct, productsState }: PropsType) {
  const autoScrollToBottomRef = useRef<HTMLDivElement>(null);
  const [isHomePage, setIsHomePage] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const router = useRouter();
  const { addProductIsLoading, addProductIsSuccess, addProductIsError, addProductMessage } =
    productsState;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductType>({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(addProductSchemaValidation),
  });

  const [attachments, setAttachments] = useState<string[]>([]);

  const handleDelete = (chipToDelete: string) => () => {
    setAttachments((chips) => chips.filter((chip) => chip !== chipToDelete));
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    const params = createParams(file);

    const command = new PutObjectCommand(params);

    setProgress(10);

    try {
      const data = await s3.send(command);

      if (params.Key && data.$metadata.httpStatusCode === 200) {
        setAttachments((chips) => [...chips, filePath(params.Key)]);
        setProgress(0);
      }
    } catch (error) {
      // enqueueSnackbar('Error uploading file', { variant: 'error' });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  useEffect(() => {
    setIsHomePage(() => false);
    restAddProduct();
  }, []);

  // Auto Scroll functionality
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    // Auto Scroll functionality
    autoScrollToBottomRef?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (addProductIsSuccess) {
      reset();
      const timer = setTimeout(() => {
        setIsHomePage(() => true);
      }, 400);

      return () => clearTimeout(timer);
    }
    const redirectToHomePage = () => {
      if (isHomePage) {
        restAddProduct();
        setIsHomePage(() => false);
        router.push('/admin/products');
      }
    };
    redirectToHomePage();
  }, [isHomePage, addProductIsSuccess]);

  useEffect(() => {
    if (addProductIsSuccess || addProductIsError) {
      setShowAlert(() => true);
      const timer = setTimeout(() => {
        setIsHomePage(() => false);
        restAddProduct();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [addProductIsError, addProductIsSuccess]);

  if (isHomePage) {
    router.push('/admin/products');
  }

  const onSubmit = (data: ProductType) => {
    addProduct({ ...data, productImages: attachments });
  };

  return (
    <div className="flex items-center justify-center py-[3rem]  ">
      <div className="md:min-w[32rem] mx-auto  w-[90%] md:max-w-[35rem]">
        <div
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {addProductIsLoading && (
            <div className=" flex items-center justify-center  ">
              <CircularProgress color="secondary" />
            </div>
          )}

          {showAlert && (addProductIsError || addProductIsSuccess) && (
            <div
              className="w-full rounded-[6px]"
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Alert
                variant="filled"
                severity={addProductIsError ? 'error' : 'success'}
                onClose={() => restAddProduct()}
              >
                {addProductMessage}
              </Alert>
            </div>
          )}

          <div className="title border-[#dadde1 border-b p-[0.7rem] text-center">
            <h1 className="text-[#1c1e21]font-bold text-[1.1rem] md:text-[1.5rem]">
              Create a new product
            </h1>
          </div>
          <div className="min-h-[10rem] w-full rounded-[6px] p-5  py-[2rem]">
            <section>
              <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                <div className="control">
                  {!errors.name && <label htmlFor="name">Name</label>}

                  {errors.name && <p className="error">{errors.name?.message} </p>}

                  <input
                    type="text"
                    id="name"
                    className={` ${errors.name ? 'is-invalid' : 'input custom-input'}`}
                    {...register('name')}
                  />
                </div>

                <div className="control">
                  {!errors.brand && <label htmlFor="name">Brand</label>}
                  {errors.brand && <p className="error">{errors.brand?.message} </p>}

                  <input
                    type="text"
                    id="brand"
                    className={` ${errors.brand ? 'is-invalid' : 'input custom-input'}`}
                    {...register('brand')}
                  />
                </div>
                <div className="control ">
                  {!errors.price && <label htmlFor="price">Price</label>}
                  <p className="error">{errors.price?.message} </p>
                  <input
                    type="text"
                    id="price"
                    className={` ${errors.price ? 'is-invalid' : 'custom-input'}`}
                    {...register('price')}
                  />
                </div>

                <Stack direction="column" alignItems="center" spacing={1}>
                  <div {...getRootProps()} style={{ cursor: 'pointer', height: '200px' }}>
                    <input {...getInputProps()} id="file-input" />
                    <p>Drag & drop a file here, or click to select a file</p>
                  </div>
                </Stack>
                {progress > 0 && <LinearProgress variant="determinate" value={progress} />}

                <Paper
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    listStyle: 'none',
                    p: 0.5,
                    m: 0,
                  }}
                  component="ul"
                >
                  {attachments.map((data) => (
                    <ListItem key={data}>
                      <Chip
                        label={data}
                        onDelete={handleDelete(data)}
                        sx={{ maxWidth: 500, textOverflow: 'ellipsis', overflow: 'hidden' }}
                      />
                    </ListItem>
                  ))}
                </Paper>

                {/* <div className="control">
                  {errors.category && <p className="error">{errors.category.message}</p>}

                  {!errors.category && (
                    <label
                      htmlFor="category"
                      className={` ${errors.productImage ? 'is-invalid' : 'custom-input'}`}
                    >
                      Category
                    </label>
                  )} */}

                 <div className="control">
                    {!errors.price && <label htmlFor="category">Category</label>}
                    <p className="error">{errors.category?.message} </p>
                    <input
                      type="text"
                      id="category"
                      className={` ${errors.category ? 'is-invalid' : 'custom-input'}`}
                      {...register('category')}
                    />
                  </div>

                  {/* <div className="month-container select">
                    <select
                      className={` ${errors.category ? 'select is-invalid' : 'select'}`}
                      {...register('category')}
                      onChange={(e) =>
                        setValue('category', e.target.value, { shouldValidate: true })
                      }
                    >
                      {productCategory.map((item: any, index: number) => (
                        <option key={index} selected={index === 0} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div> */}
                {/* </div> */}

                <div className="control">
                  {!errors.stock && <label htmlFor="stock">Stock Info</label>}
                  {errors.stock && <p className="error">{errors.stock?.message} </p>}
                  <input
                    type="text"
                    id="stock"
                    className={` ${errors.stock ? 'is-invalid' : 'input custom-input'}`}
                    {...register('stock')}
                  />
                </div>

                <div className="control">
                  {!errors.description && <label htmlFor="description">Description</label>}
                  <p className="error">{errors.description?.message} </p>

                  <textarea
                    className={`outline-none hover:outline-none ${
                      errors.description ? 'is-invalid' : 'custom-input'
                    }`}
                    id="description"
                    rows={4}
                    cols={50}
                    {...register('description')}
                  />
                </div>
                <div className="control">
                  {!errors.address && <label htmlFor="address">Address</label>}
                  <p className="error">{errors.address?.message} </p>

                  <textarea
                    className={`outline-none hover:outline-none ${
                      errors.address ? 'is-invalid' : 'custom-input'
                    }`}
                    id="address"
                    rows={4}
                    cols={50}
                    {...register('address')}
                  />
                </div>
                <div className="control">
                  {!errors.sellerContact && <label htmlFor="sellerContact">Seller Contact</label>}
                  <p className="error">{errors.sellerContact?.message} </p>

                  <input
                    type="text"
                    id="sellerContact"
                    className={` ${errors.sellerContact ? 'is-invalid' : 'custom-input'}`}
                    {...register('sellerContact')}
                  />
                </div>
                <div className="control">
                  {!errors.sellerEmail && <label htmlFor="sellerEmail">Seller Email</label>}
                  <p className="error">{errors.sellerEmail?.message} </p>

                  <input
                    type="text"
                    id="sellerEmail"
                    className={` ${errors.sellerEmail ? 'is-invalid' : 'custom-input'}`}
                    {...register('sellerEmail')}
                  />
                </div>
                <div className="control">
                  {!errors.sellerAddress && <label htmlFor="sellerAddress">Seller Address</label>}
                  <p className="error">{errors.sellerAddress?.message} </p>

                  <input
                    type="text"
                    id="sellerAddress"
                    className={` ${errors.sellerAddress ? 'is-invalid' : 'custom-input'}`}
                    {...register('sellerAddress')}
                  />
                </div>
                <div className="control">
                  {!errors.sellerName && <label htmlFor="sellerName">Seller Name</label>}
                  <p className="error">{errors.sellerName?.message} </p>

                  <input
                    type="text"
                    id="sellerName"
                    className={` ${errors.sellerName ? 'is-invalid' : 'custom-input'}`}
                    {...register('sellerName')}
                  />
                </div>
                <div className="mt-[-2rem] flex  flex-col justify-between lg:flex-row lg:items-center lg:justify-around  lg:space-x-5 ">
                  <div>
                    <button
                      type="submit"
                      className=" mx-auto mt-[1.5rem] block h-[2.7rem]    w-full  min-w-[150px] rounded-[4px]  border border-[#42b72a] bg-[#42b72a] py-[8px] px-[16px] text-[1rem]  font-bold text-white transition duration-150 hover:border-[#256818]  hover:bg-[#256818]"
                    >
                      Add Product
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className=" rest-btn mx-auto block h-[2.7rem]    w-full  min-w-[150px]   rounded-[4px] border py-[8px] px-[16px] text-[1rem] font-bold transition duration-150"
                      onClick={() => reset()}
                    >
                      Reset?
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: ReducerType) => ({
  productsState: state.products,
});

const mapDispatchToProps = {
  addProduct,
  restAddProduct,
};

export default connect(mapStateToProps, mapDispatchToProps)(AddProductComponent);
