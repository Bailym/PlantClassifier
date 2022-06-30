# Plant Classifier

**MobileNET image classifier to be used with PlantCareApp**

**Key Details**
- React front end
- Node + express server
- JSON Classifier
- Tensorflow JS MobileNET pre trained model.
- Uses transfer learning to build on top of MobileNET model

**Features**
- Uploading images
- Getting predictions from the model
- Use labels to train the model if it doesnt classify correctly (supervised learning)

**Screenshots**

Home page (this didnt need to look fancy, just a dev tool.
![home](https://github.com/Bailym/PlantClassifier/blob/master/images/Home.png?raw=true)

Upload an image to be classified
![image](https://github.com/Bailym/PlantClassifier/blob/master/images/Upload.png?raw=true)

See the initial prediction (percentage of certainty)

![classify](https://user-images.githubusercontent.com/44368942/176790193-aacad5ee-875e-4f6e-87be-d8ad0e7b3d68.png)

If not 100% certainty, provide a label so the model can learn from this image. This will update the model with the new weighting.
![label](https://user-images.githubusercontent.com/44368942/176790285-1fb2ceac-8d21-4855-b593-edb108b075ce.png)
