import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Form } from '../../../components/Form';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { CATEGORIES } from '../../../constants/categories';
import styles from './ModalAddAndUpdateVideo.module.css';
import { AUTHORS } from '../../../constants/authors';
import { Suspense, useMemo, useState } from 'react';
import { addVideo, editVideo } from '../../../services/videos';
import { ProcessedVideo } from '../../../types/video';

type ModalAddVideoProps = {
  open: boolean;
  onCancel: () => void;
  onFinish?: (values: FormValues) => void;
  onSuccess?: () => void;
  video?: ProcessedVideo | null;
};

export interface FormValues {
  videoName: string;
  videoAuthor: number;
  videoCategory: number[];
}

export const ModalAddVideo = ({ open, onCancel, onSuccess, video }: ModalAddVideoProps) => {
  const isEditMode = !!video;
  const [submitting, setSubmitting] = useState(false);
  const handleFinish = async (values: Record<string, unknown>) => {
    try {
      setSubmitting(true);
      const formValues = values as unknown as FormValues;
      if (isEditMode) {
        await editVideo(video.id, formValues.videoAuthor, {
          name: formValues.videoName,
          catIds: formValues.videoCategory,
        });
      } else {
        await addVideo(formValues.videoAuthor, {
          name: formValues.videoName,
          catIds: formValues.videoCategory,
        });
      }
      onSuccess?.();
      onCancel();
    } catch (error) {
      window.alert(`Failed to ${isEditMode ? 'edit' : 'add'} video: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishFailed = (errors: Record<string, string>) => {
    window.alert('Validation failed:' + Object.values(errors).join(', '));
  };

  const initialValues = useMemo(
    () =>
      isEditMode
        ? {
            videoName: video.name,
            videoAuthor: AUTHORS.find((a) => a.label === video.author)?.value,
            videoCategory: video.categories.map((cat) => CATEGORIES.find((c) => c.label === cat)?.value).filter(Boolean),
          }
        : undefined,
    [isEditMode, video]
  );

  return (
    <Modal
      open={open}
      title={isEditMode ? 'Edit Video' : 'Add Video'}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      confirmLoading={submitting}>
      <Suspense fallback={<div>Loading...</div>}>
        <Form
          key={String(open)}
          layout="vertical"
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
          initialValues={initialValues}>
          <Form.Item label="Video Name" name="videoName" rules={[{ required: true, message: 'Please enter video name' }]}>
            <Input placeholder="Enter video name" />
          </Form.Item>
          <Form.Item label="Video Author" name="videoAuthor" rules={[{ required: true, message: 'Please select author name' }]}>
            <Select placeholder="Select author name" allowClear options={AUTHORS} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Video Category" name="videoCategory" rules={[{ required: true, message: 'Please select a category' }]}>
            <Select placeholder="Select a category" showSearch allowClear options={CATEGORIES} style={{ width: '100%' }} mode="multiple" />
          </Form.Item>
          <div className={styles.modalBtn}>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {isEditMode ? 'Save' : 'Add'}
            </Button>
          </div>
        </Form>
      </Suspense>
    </Modal>
  );
};
