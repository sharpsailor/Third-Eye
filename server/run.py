import argparse

import cv2

from model import Model

model = Model()
image = cv2.imread('./your_image.jpg')
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
label = model.predict(image=image)['label']
print('Image label is: ', label)

def argument_parser():
    parser = argparse.ArgumentParser(description="Violence detection")
    parser.add_argument('--image-path', type=str,
                        default='./data/7.jpg',
                        help='path to your image')
    args = parser.parse_args()
    return args


if __name__ == '__main__':
    args = argument_parser()
    model = Model()
    image = cv2.imread(args.image_path)
    label = model.predict(image=image)['label']
    print('predicted label: ', label)
    cv2.imshow(label.title(), image)
    cv2.waitKey(0)
