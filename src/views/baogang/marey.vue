<template>
	<div class="custom-marey" style="margin-top : -2px">
		<el-row >
			<el-col :span="5" style="margin-top : 1px">
				<div class="title-background"> <span id="title-first">iPWIMVis</span></div>
					<!-- <div class="control-logo" style="font-size: 16px;"><span>Controls</span></div> -->

					<!-- <el-row style="margin: 2px 0;background: white">
						<div class="panel-title">Global Parameters</div>
						<el-form size="mini" label-width="100px" style="padding-right: 10px;">
							<el-form-item label="Interval:" >
								<el-select size="mini" v-model="interval" @change="changeTimeBrush">
									<el-option v-for="option in intervalOptions" :key="option" :label="option" :value="option"></el-option>
								</el-select>
							</el-form-item> -->
							<!-- <el-form-item label="Algorithm:">
								<el-select size="mini" v-model="algorithmSelected" @change="getAlgorithmData">
									<el-option v-for="option in algorithmOptions" :key="option" :label="option" :value="option"></el-option>
								</el-select>
							</el-form-item> -->
						<!-- </el-form>
					</el-row> -->

					<!-- <el-row style="margin: 2px 0;background: white">
						<div class="panel-title">Color Scheme</div>
						<el-form size="mini" label-width="100px" style="padding-right: 10px;">
							<el-form-item label="Scheme:" >
								<el-switch v-model="isSwitch" @change="switchChange" active-text="Quality" inactive-text="Category">
								</el-switch>
							</el-form-item>
						</el-form>
					</el-row> -->
					<!-- <el-row style="margin: 2px 0;background: white">
						<div class="panel-title" style="margin: 10px 0; font-size: 14px;">Sorting scheme</div>
						<el-form size="mini" label-width="70px" style="padding-right: 10px;">
							<el-form-item label="Scheme:">
								<el-switch v-model="biasCalcuMeth" @change="switchSort" active-text="Min-Max" inactive-text="Average">
								</el-switch>
							</el-form-item>
						</el-form>
					</el-row> -->


					<el-row>
						<el-card class="myel-card" style="margin:1px 5px">
							<div class="my-card-body" style="height:48px; width:100%; display:flex;">
								<time-brush ref="timeBrush" style="flex: 1 0 210px;" 
									@timeBrushed="setStartEndDate"
									:custom-height="'50px'">
								</time-brush>
								<el-button style="height: 48px; flex: 0 0 auto; " type="danger" size="small" @click="getHttpData" icon="el-icon-search" :disabled="isSearch"></el-button>
							</div>	
						</el-card>
					</el-row>
					<el-row>
						<el-col :span="24" 
							v-loading="scatterLoading"
							element-loading-text="拼命计算中"
							element-loading-spinner="el-icon-loading"
							element-loading-background="rgba(0, 0, 0, 0.3)">
						<el-card class="myel-card">
							<div class="my-card-title" slot="header">
								<span>Embedding View</span>
								<el-select size="mini" v-model="algorithmSelected" @change="getAlgorithmData" class="card-select">
									<el-option v-for="option in algorithmOptions" :key="option" :label="option" :value="option"></el-option>
								</el-select>
							</div>
							<div class="my-card-body">
								<scatterlog ref="scatterloging" style="height:360px;"></scatterlog>
							</div>
						</el-card>
					</el-col>
					</el-row>
					<el-row>
						<el-card class="myel-card">
						<el-row style=";background: white">
						<!-- <div class="panel-title">Tabular Parameters</div> -->
						<el-row :gutter="8">
						<!-- <div class="panel-title"></div> -->
						<el-form size="mini" label-width="100px" style="padding-right: 10px;margin:5px">
							<el-form-item label="Date">
								<el-date-picker v-model="dateselect" type="datetimerange" range-separator=" " @change="changeTime" start-placeholder="开始日期" end-placeholder="结束日期" style="width:200px;" size="mini">                 
								</el-date-picker> 
							</el-form-item>
						</el-form>
						</el-row>
						<!-- <el-row :gutter="8">
							<el-col :span="8" style="font-size: 13px;">
								<div style="height: 24px;padding-right:5px;margin:2px 0" class="fontcolor">ThicknessGap </div>
								<div style="height: 24px;padding-left:16px;margin:2px 0" class="fontcolor">WidthGap </div>
								<div style="height: 24px;padding-left:12px;margin:2px 0" class="fontcolor">LengthGap </div>
							</el-col>
							<el-col :span="10" id="imput-line">
								<mu-slider v-model="plateTempProp.thickness" :step="1" :min="1" :max="20" :display-value="false" style="margin:3px 0;color:#999a9d"></mu-slider>
								<mu-slider v-model="plateTempProp.width" :step="1" :min="10" :max="2500" :display-value="false" style="margin:3px 0;color:#999a9d"></mu-slider>
								<mu-slider v-model="plateTempProp.length" :step="1" :min="1" :max="25" :display-value="false" style="margin:3px 0;color:#999a9d"></mu-slider>
							</el-col>
							<el-col :span="4">
								<div style="margin-bootom:2px" class="fontcolor">{{plateTempProp.thickness}}mm</div>
								<div style="margin:4px 0px" class="fontcolor">{{plateTempProp.width}}mm</div>
								<div style="margin:6px 0px" class="fontcolor"> {{plateTempProp.length}}m</div>
							</el-col>
						</el-row> -->
						<!-- <el-form size="mini" label-width="100px" >
							<el-form-item label="Category" style="padding-right: 10px;margin-bottom:4px;font-size:13px;padding-left:2px" class="abel">
									<el-select v-model="plateTempPropvalue"   placeholder="请选择钢板型号" size="mini" multiple style="margin:6px">
									<el-option v-for="item in plateoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
								</el-select>
							</el-form-item> -->
							<!-- <el-form-item label="Order:" style="border-top: solid lightgrey 0.15rem;padding-right: 10px;padding-top:8px;margin:4px;margin-bottom:0px;" class="abel">
									<el-select v-model="orderselect"   placeholder="请选择工序排序方法" size="mini" style="margin-top:4px" @change="orderchange">
									<el-option v-for="item in orderoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
								</el-select>
							</el-form-item> -->
						<!-- </el-form> -->

						<!-- <el-row :gutter="8">
							<el-col :span="8" style="font-size: 13px;">
								<div style="height: 24px;padding-left:40px" class="fontcolor">Range </div>                
							</el-col>
							<el-col :span="10" id="imput-line">
								<mu-slider v-model="plateTempProp.deviation" :step="1" :min="0" :max="50" range :display-value="false" style="margin:2.5px;color:#999a9d"></mu-slider>
							</el-col>
							<el-col :span="4">
								<div style="margin:2px">{{plateTempProp.deviation}}%</div>
							</el-col>
						</el-row> -->
						</el-row>			 

						<el-row style="background: white">
							<svgTable ref="jsontable" style="height:500px;width:100%"></svgTable>
						</el-row>
					</el-card>
					</el-row>
			</el-col>

			<el-col :span="19"
				v-loading="loadingDataLoading"
				element-loading-text="loading..."
				element-loading-spinner="el-icon-loading"
				element-loading-background="rgba(0, 0, 0, 0.3)">



				<el-row style="margin-top: 3px;">
					<el-col :span="18" >
						<el-row>
							<el-card class="myel-card">
								<div class="my-card-title" slot="header">
									<span>Condition View</span>
									<el-switch v-model="isSwitch" @change="switchChange" active-text="Quality" inactive-text="Category" class="myel-swtich"></el-switch>
								</div>
								<div class="my-card-body">
									<marey-chart style="text-align: center; height: 480px;width:100%;" ref="mareyChart" @trainClick="trainClick" @trainMouse="trainMouse"></marey-chart>
								</div>
							</el-card>
						</el-row>
						<el-row>
							<div>
								<el-card class="myel-card">
									<div class="my-card-title" slot="header">
										<span>Diagnosis View</span>
									</div>
									<div style="padding-right:5px; padding-bottom : 5px">
										<el-col :span="11">
											<el-card class="myel-card">
												<div class="my-card-body" >
													<wheeler ref="wheelering" style="height:500px"></wheeler>
												</div>
											</el-card>
										</el-col>
										<el-col :span="13" style="padding-right:5px">
											<el-card class="myel-card">
												<div class="my-card-body" >
													<swheel ref="wheeler1" style="height:248px"></swheel>
												</div>
											</el-card>
											<el-card class="myel-card">
												<div class="my-card-body" >
													<swheel ref="wheeler2" style="height:248px"></swheel>
												</div>
											</el-card>	
										</el-col>
									</div>
								</el-card>							
							</div>
						</el-row>
					</el-col>
					<el-col :span="6">
						<el-card class="myel-card">
							<div class="my-card-title" slot="header">
								<span>Key-Stage View</span>
								<el-select v-model="orderselect"   placeholder="请选择工序排序方法" size="mini"  @change="orderchange" class="card-select">
									<el-option v-for="item in orderoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
								</el-select>
								<el-popover placement="top" width="350" trigger="hover" style="float:right;margin-right:11px">
								<el-row :gutter="8">
									<el-col :span="8" style="font-size: 13px;">
										<div style="height: 24px;padding-right:5px;margin:2px 0" class="fontcolor">ThicknessGap </div>
										<div style="height: 24px;padding-left:16px;margin:2px 0" class="fontcolor">WidthGap </div>
										<div style="height: 24px;padding-left:12px;margin:2px 0" class="fontcolor">LengthGap </div>
									</el-col>
									<el-col :span="10" id="imput-line">
										<mu-slider v-model="plateTempProp.thickness" :step="1" :min="1" :max="20" :display-value="false" style="margin:3px 0;color:#999a9d"></mu-slider>
										<mu-slider v-model="plateTempProp.width" :step="1" :min="10" :max="2500" :display-value="false" style="margin:3px 0;color:#999a9d"></mu-slider>
										<mu-slider v-model="plateTempProp.length" :step="1" :min="1" :max="25" :display-value="false" style="margin:3px 0;color:#999a9d"></mu-slider>
									</el-col>
									<el-col :span="4">
										<div style="margin-bootom:2px" class="fontcolor">{{plateTempProp.thickness}}mm</div>
										<div style="margin:4px 0px" class="fontcolor">{{plateTempProp.width}}mm</div>
										<div style="margin:6px 0px" class="fontcolor"> {{plateTempProp.length}}m</div>
									</el-col>
								</el-row>
								<el-form size="mini" label-width="100px" >
									<el-form-item label="Category" style="padding-right: 10px;margin-bottom:4px;font-size:13px;padding-left:2px" class="abel">
											<el-select v-model="plateTempPropvalue"   placeholder="请选择钢板型号" size="mini" multiple style="margin:6px">
											<el-option v-for="item in plateoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
										</el-select>
									</el-form-item>
									<!-- <el-form-item label="Order:" style="border-top: solid lightgrey 0.15rem;padding-right: 10px;padding-top:8px;margin:4px;margin-bottom:0px;" class="abel">
											<el-select v-model="orderselect"   placeholder="请选择工序排序方法" size="mini" style="margin-top:4px" @change="orderchange">
											<el-option v-for="item in orderoptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
										</el-select>
									</el-form-item> -->
								</el-form>

								<el-row :gutter="8">
									<el-col :span="8" style="font-size: 13px;">
										<div style="height: 24px;padding-left:40px" class="fontcolor">Range </div>                
									</el-col>
									<el-col :span="10" id="imput-line">
										<mu-slider v-model="plateTempProp.deviation" :step="1" :min="0" :max="50" range :display-value="false" style="margin:2.5px;color:#999a9d"></mu-slider>
									</el-col>
									<el-col :span="4">
										<div style="margin:2px">{{plateTempProp.deviation}}%</div>
									</el-col>
								</el-row>
								<el-row style="background: white">
									<div style="margin: 5px 0px 2px 0px;">
										<el-row>
											<el-col :span="8" style="font-size: 12px;">
												<div style="height: 24px;padding-left:1px;margin-top:10px" class="fontcolor">Crucial Process </div>
											</el-col>
											<el-col :span="5">
												<el-button  circle style="padding:8px;box-shadow:1px 1px 2.5px #000;" class="heatclass heat" @mouseover.native="heatindex=true" 
													@mouseout.native="heatindex=false" @click="processclick(0)">
													<img src="../../assets/images/heatwhite.svg" style="height:20px;width:20px;" v-if="heatindex"/>
													<img src="../../assets/images/heat.svg" style="height:20px;width:20px"  v-if="!heatindex"/>
												</el-button>
											</el-col>
											<el-col :span="5">
												<el-button circle style="padding:8px;box-shadow:1px 1px 2.5px #000;" class="heatclass roll" @mouseover.native="rollindex=true" 
													@mouseout.native="rollindex=false" @click="processclick(1)">
													<img src="../../assets/images/rollwhite.svg" style="height:20px;width:20px;" v-if="rollindex"/>
													<img src="../../assets/images/roll.svg" style="height:20px;width:20px"  v-if="!rollindex"/></el-button>
											</el-col>
											<el-col :span="5">
												<el-button circle style="padding:8px;box-shadow:1px 1px 2.5px #000;" class="heatclass cool" @mouseover.native="coolindex=true" 
													@mouseout.native="coolindex=false" @click="processclick(2)">
													<!-- <img src="../../assets/images/coolwhite1.svg" style="height:50px;width:50px;" v-if="coolindex"/> -->
													<svg v-if="!coolindex" t="1606749950536" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7351" width="20" height="20"><path d="M494.378667 466.915556V291.356444l-85.731556-41.813333a15.758222 15.758222 0 0 1-8.846222-14.165333v-17.536a15.758222 15.758222 0 0 1 22.670222-14.165334l71.907556 35.072V129.536c0-8.704 7.054222-15.758222 15.772444-15.758222h15.758222c8.704 0 15.758222 7.054222 15.758223 15.758222v109.198222l71.921777-35.072a15.758222 15.758222 0 0 1 22.670223 14.165334v17.536c0 6.030222-3.441778 11.52-8.860445 14.165333l-85.731555 41.813333v175.587556l152.064-87.793778-6.656-95.146667c-0.426667-6.016 2.616889-11.747556 7.836444-14.762666l15.189333-8.760889a15.758222 15.758222 0 0 1 23.608889 12.544l5.589334 79.815111 94.563555-54.584889a15.758222 15.758222 0 0 1 21.532445 5.76l7.879111 13.653333c4.352 7.537778 1.763556 17.180444-5.774223 21.532445l-94.563555 54.599111 66.332444 44.743111a15.758222 15.758222 0 0 1-0.924444 26.723556l-15.189333 8.760888A15.758222 15.758222 0 0 1 796.444444 473.457778l-79.075555-53.347556-152.064 87.793778 152.049778 87.779556 79.075555-53.333334a15.758222 15.758222 0 0 1 16.711111-0.583111l15.189334 8.760889a15.758222 15.758222 0 0 1 0.924444 26.737778l-66.332444 44.728889 94.577777 54.599111c7.537778 4.352 10.112 13.994667 5.76 21.532444l-7.879111 13.653334c-4.352 7.537778-13.994667 10.126222-21.532444 5.76l-94.577778-54.584889-5.575111 79.815111a15.758222 15.758222 0 0 1-23.608889 12.544l-15.189333-8.760889a15.758222 15.758222 0 0 1-7.836445-14.762667l6.656-95.146666-152.064-87.793778v175.587555l85.731556 41.813334c5.418667 2.631111 8.860444 8.135111 8.860444 14.165333v17.536a15.758222 15.758222 0 0 1-22.670222 14.165333l-71.921778-35.072v109.198223c0 8.704-7.054222 15.758222-15.758222 15.758222H510.151111a15.758222 15.758222 0 0 1-15.772444-15.758222v-109.198223l-71.907556 35.072a15.758222 15.758222 0 0 1-22.670222-14.165333v-17.536c0-6.030222 3.427556-11.52 8.846222-14.165333l85.731556-41.813334V548.835556L342.328889 636.629333l6.656 95.146667c0.426667 6.016-2.631111 11.747556-7.850667 14.762667l-15.189333 8.760889a15.758222 15.758222 0 0 1-23.608889-12.544l-5.575111-79.815112-94.563556 54.584889a15.758222 15.758222 0 0 1-21.532444-5.76l-7.879111-13.653333a15.758222 15.758222 0 0 1 5.76-21.532444l94.577778-54.599112-66.346667-44.743111a15.758222 15.758222 0 0 1 0.938667-26.723555l15.189333-8.760889a15.758222 15.758222 0 0 1 16.696889 0.568889l79.075555 53.347555L470.755556 507.889778l-152.064-87.793778-79.075556 53.333333a15.758222 15.758222 0 0 1-16.696889 0.583111l-15.189333-8.760888a15.758222 15.758222 0 0 1-0.938667-26.737778l66.332445-44.728889-94.563556-54.599111a15.758222 15.758222 0 0 1-5.76-21.532445l7.879111-13.653333c4.352-7.537778 13.994667-10.112 21.532445-5.76l94.563555 54.584889 5.575111-79.815111a15.758222 15.758222 0 0 1 23.608889-12.544l15.189333 8.760889c5.219556 3.015111 8.263111 8.746667 7.850667 14.762666l-6.656 95.146667 152.049778 87.793778z" p-id="7352" fill="#28b2f7"></path></svg>
													<svg v-if="coolindex" t="1606749950536" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7351" width="20" height="20"><path d="M494.378667 466.915556V291.356444l-85.731556-41.813333a15.758222 15.758222 0 0 1-8.846222-14.165333v-17.536a15.758222 15.758222 0 0 1 22.670222-14.165334l71.907556 35.072V129.536c0-8.704 7.054222-15.758222 15.772444-15.758222h15.758222c8.704 0 15.758222 7.054222 15.758223 15.758222v109.198222l71.921777-35.072a15.758222 15.758222 0 0 1 22.670223 14.165334v17.536c0 6.030222-3.441778 11.52-8.860445 14.165333l-85.731555 41.813333v175.587556l152.064-87.793778-6.656-95.146667c-0.426667-6.016 2.616889-11.747556 7.836444-14.762666l15.189333-8.760889a15.758222 15.758222 0 0 1 23.608889 12.544l5.589334 79.815111 94.563555-54.584889a15.758222 15.758222 0 0 1 21.532445 5.76l7.879111 13.653333c4.352 7.537778 1.763556 17.180444-5.774223 21.532445l-94.563555 54.599111 66.332444 44.743111a15.758222 15.758222 0 0 1-0.924444 26.723556l-15.189333 8.760888A15.758222 15.758222 0 0 1 796.444444 473.457778l-79.075555-53.347556-152.064 87.793778 152.049778 87.779556 79.075555-53.333334a15.758222 15.758222 0 0 1 16.711111-0.583111l15.189334 8.760889a15.758222 15.758222 0 0 1 0.924444 26.737778l-66.332444 44.728889 94.577777 54.599111c7.537778 4.352 10.112 13.994667 5.76 21.532444l-7.879111 13.653334c-4.352 7.537778-13.994667 10.126222-21.532444 5.76l-94.577778-54.584889-5.575111 79.815111a15.758222 15.758222 0 0 1-23.608889 12.544l-15.189333-8.760889a15.758222 15.758222 0 0 1-7.836445-14.762667l6.656-95.146666-152.064-87.793778v175.587555l85.731556 41.813334c5.418667 2.631111 8.860444 8.135111 8.860444 14.165333v17.536a15.758222 15.758222 0 0 1-22.670222 14.165333l-71.921778-35.072v109.198223c0 8.704-7.054222 15.758222-15.758222 15.758222H510.151111a15.758222 15.758222 0 0 1-15.772444-15.758222v-109.198223l-71.907556 35.072a15.758222 15.758222 0 0 1-22.670222-14.165333v-17.536c0-6.030222 3.427556-11.52 8.846222-14.165333l85.731556-41.813334V548.835556L342.328889 636.629333l6.656 95.146667c0.426667 6.016-2.631111 11.747556-7.850667 14.762667l-15.189333 8.760889a15.758222 15.758222 0 0 1-23.608889-12.544l-5.575111-79.815112-94.563556 54.584889a15.758222 15.758222 0 0 1-21.532444-5.76l-7.879111-13.653333a15.758222 15.758222 0 0 1 5.76-21.532444l94.577778-54.599112-66.346667-44.743111a15.758222 15.758222 0 0 1 0.938667-26.723555l15.189333-8.760889a15.758222 15.758222 0 0 1 16.696889 0.568889l79.075555 53.347555L470.755556 507.889778l-152.064-87.793778-79.075556 53.333333a15.758222 15.758222 0 0 1-16.696889 0.583111l-15.189333-8.760888a15.758222 15.758222 0 0 1-0.938667-26.737778l66.332445-44.728889-94.563556-54.599111a15.758222 15.758222 0 0 1-5.76-21.532445l7.879111-13.653333c4.352-7.537778 13.994667-10.112 21.532445-5.76l94.563555 54.584889 5.575111-79.815111a15.758222 15.758222 0 0 1 23.608889-12.544l15.189333 8.760889c5.219556 3.015111 8.263111 8.746667 7.850667 14.762666l-6.656 95.146667 152.049778 87.793778z" p-id="7352" fill="#ffffff"></path></svg>
													<!-- <img src="../../assets/images/cool.svg" style="height:50px;width:50px"  v-if="coolindex"/> -->
													</el-button>
											</el-col>									
										</el-row>
									</div>
								</el-row>
								<i class="el-icon-s-data" slot="reference" style="vertical-align: middle;line-height:1.5"></i>
								</el-popover>
								
								</div>
							<el-row>
								
							</el-row>
							<el-row style="margin: 2px 0">
									<el-col :span="24">
									<div  v-for="item of processInTurn" :key = item class="myel-card" style="width:100%">
										<div class="my-card-title" style="height: 3px;font-size:10px;font-weight:150">{{item}}</div>
											<div class="my-card-body">
											<three-bar :ref="item" style="height: 190px;" ></three-bar>
											</div>
									</div>	
									</el-col>
									
							</el-row>
						</el-card>
					</el-col>
				</el-row>

				<!-- <el-row style="margin: 2px 0; overflow:auto; display:flex;flex-wrap: nowrap;">
					<el-col :span="8" style="flex-shrink: 0;flex-grow: 0;" class="my-card" v-for="item of processInTurn" :key = item>
						<el-card class="my-card-body-detail">
							<div class="my-card-title" style="height: 3px;font-size:10px;font-weight:150">{{item}}</div>
							<div class="my-card-body-detail-some">
								<three-bar :ref="item" style="height: 190px;" ></three-bar>
							</div>
						</el-card>
					</el-col>
				</el-row> -->
			</el-col>
		</el-row>
	</div>
</template>

<script>




import * as d3 from 'd3';
import util from './util.js';
import scatter from './scatter.vue';
import mareyChart from './mareyChart.vue';
import polyLineChart from './polyLine.vue';
import plateTemperature from './plateTemperature.vue';
import scatterlog from './scatterlog.vue';
import timeBrush from './timeBrush.vue';
import gauge from './gauge.vue';
import threeBar from './threeBar.vue';
import wheeler from './wheeler.vue';
import swheel from './swheel.vue';
import force from './force.vue';
import heat from "./heat.vue";
import riverLike from "./riverLike.vue";
import svgTable from "./svgTable.vue";
import bar from "./Bar.vue";
import scatterAxis from "./scatterAxis.vue"
import { baogangAxios, baogangPlotAxios } from 'services/index.js'
import myJsonData from "./jsondata.js"
import myStationData from "./stationdata.js"
var echarts = require('echarts');
export default {
	components: { mareyChart, scatter, polyLineChart, svgTable, plateTemperature, timeBrush, gauge, heat, riverLike, bar, scatterAxis, threeBar, force,scatterlog , wheeler , swheel },
	data() {
		return {
			symbolvalue:0.05,
			linesize:0.25,
			heatindex:false,
			rollindex:false,
			coolindex:false,
			diagnosisData:[],
			// monthToShow: new Date('2018-09-15 00:00:00'),
			scatterLoading: false,
			isSearch: true,
			processName:'',
			myScatterChart: {},
			plateoptions:[{
					value: 'All',
					label: 'All'
				}],
			orderoptions:[{
					value: 'Number',
					label: 'Number'
				},{
					value: 'Deviation',
					label: 'Deviation'
				},{
					value: 'Original',
					label: 'Original'
				}],
			orderselect:'Deviation',
			errorflag:false,
			plateTempPropvalue:['All'],
			isSwitch: false,
			startDate: new Date('2018-10-16 00:00:00'),
			endDate: new Date('2018-10-19 04:00:00'),
			dateselect:[new Date(2018, 10, 1, 0, 0), new Date(2018, 10, 15, 0, 0)],
			display: false,
			time: undefined,
			radarIndicatorOptions: [],
			indicators: [],
			temperatureData: {},
			selectedTrainData: [],
			selectedTrainColor: 'green',
			tempStations: [],
			interval: 12,
			intervalOptions: [6, 12, 24, 48],
			algorithmOptions: [
				"T-SNE", "MDS", "PCA"
			],
			algorithmUrls: {
				"T-SNE": "/baogangapi/v1.0/model/VisualizationTsne/",
				"MDS": "/baogangapi/v1.0/model/VisualizationMDS/",
				"PCA": "/baogangapi/v1.0/model/VisualizationPCA/"
			},
			algorithmSelected: "T-SNE",
			plateTempProp: {
				slabid: "44191730513",
				width: 30,
				length: 10,
				thickness: 5,
				deviation:25
			},
			test: 15,
			detailProcess: [],
			processInTurn: [null, null ,null, null ,null, null],
			processData: {},
			scatterlogdata:[],
			processArray: ['heat', 'roll', 'cool'],
			forcedata:{},
			// biasData: [],
			// biasCalcuMeth: false,
			loadingDataLoading: false,
			radio: 0,
			chooseList: [],
			processTurn: null, 
			kindRef: {
				length: 0.5,
				width: 0.5,
				thickness: 0.5
			},
			scatterResponse: null
		}
	},
	computed: {},
	created() {
		// this.day()
	},
	methods: {
		// forceswtich(){
		// 	this.$refs.force.sizechange()
		// },
		changeTimeBrush() {
			this.getTimeBrushData();
		},
		changeTime() {
			// // this.$message('这是一条消息提示');
			// this.$message(this.monthToShow.toString())
			// let timeArr = this.monthToShow.toString().split(' ')
			this.changeTimeBrush()
			// this.getRadarIndicatorOptions()
			this.scattlog()
		},
		cellStyle (rowData) {
			if (rowData.columnIndex === 2) {
				return {
					backgroundImage: 'url(./background.png)',
					backgroundSize: `${rowData.row.value.score * 100}% 100%`,
					backgroundRepeat: 'no-repeat'
				}
			}
		},
		toggleSelection(rows) {
			if (rows) {
				rows.forEach((item, index) => {
					if (index < 6) {
						this.$refs.multipleTable.toggleRowSelection(item, true);
					}
				});
			} else {
				this.$refs.multipleTable.clearSelection();
			}
		},
		setStartEndDate([start, end]) {
			if(start)this.startDate = new Date(+new Date(start) - 1000 * 60 * 60 * this.interval)
			if(end)this.endDate = new Date(end)
		},
		async getHttpData() {
			this.jsonData = myJsonData
			this.mergeflag()
			this.$refs.mareyChart.paintMareyChart(this.jsonData,myStationData)
			this.$refs.jsontable.paintChart()
			return
			// this.clearAllChart()
			this.plateTempPropvalue=['All']
			this.isSearch = true
			this.loadingDataLoading = true
			let startDate = util.timeFormat(this.startDate);
			let endDate = util.timeFormat(this.endDate);
			// let startDate="2018-11-01 00:00:00";
			// let endDate = "2018-11-01 12:00:00";
			// request
			// let stationsResponse = this.getStationsData(startDate, endDate);
			// let jsonResponse = this.getJsonData(startDate, endDate);
			// let conditionResponse = this.getConditionData(startDate, endDate);
			// let temperatureResponse = this.getTemperatureData();

			// response
			// this.stationsData = (await this.getStationsData(startDate, endDate)).data;
			await this.getStationsData(startDate, endDate).then(Response => {
				this.stationsData=Response.data
					}).catch(function(error) {
				// 处理 getJSON 和 前一个回调函数运行时发生的错误
				console.log('发生错误！', error);
				// this.$alert('请求时间刷图异常，请检查连接或者刷新', '警告', {
				//   confirmButtonText: '确定',
				//   callback: action => {
				//     this.$message({
				//       type: 'info',
				//       message: `action: ${ action }`
				//     });
				//   }
				// });
					})
			this.jsonData = (await this.getJsonData(startDate, endDate)).data;
			console.log(d3.groups(this.jsonData , d => d.flag))
			

			let flagData = (await baogangAxios(`/baogangapi/v1.0/getFlag/${startDate}/${endDate}/`)).data
			// this.getplatetype();
			let allDataArr = []
			for (let item of this.jsonData) {
					let upid = item['upid']
					allDataArr.push(flagData[upid])
			}

			for (let i = 0; i < this.jsonData.length; i++) {
				this.jsonData[i]['flag'] = allDataArr[i]
			}

			// paint
			this.loadingDataLoading = false
			this.scatterLoading = false
			this.isSearch = false
			if(this.jsonData.length===0)	this.erroralert('时间线图选择错误，请重新选择')
			console.log(d3.groups(this.jsonData , d => d.flag))
			if(this.scatterlogdata.length!==0)	this.mergeflag()
			console.log(d3.groups(this.jsonData , d => d.flag))
			// this.$refs.mareyChart.paintMareyChart(this.jsonData, this.stationsData);
			this.$refs.mareyChart.paintMareyChart()

			// clear
			this.selectedTrainData = [];
			// this.$refs.scatterloging.paintArc([this.startDate, this.endDate])
			this.scatterLoading = false
			this.isSearch = false
		},
		mergeflag(){
			// let mergedata=this.scatterlogdata
			let mergedata=[]
			for (let item in this.scatterlogdata){
				let toc=new Date(this.scatterlogdata[item].toc)
				if(toc<this.endDate&&toc>this.startDate)
					mergedata.push(this.scatterlogdata[item])
			}
			mergedata.map(item=>{				
				this.jsonData.map(json=>{
					if(json.upid===item.upid){
						json.flag=+item.label
					}
					return json
				})
			})
			// let mergejson = [];
			// this.jsonData.map(item=>{				
			// 	mergedata.map(json=>{
			// 		if(item.upid===json.upid){
			// 			item.flag=+json.label
			// 			mergejson.push(item)
			// 		}
			// 		return json
			// 	})
			// })
			// this.jsonData=mergejson;
		},
		// clearAllChart() {
		//   this.$refs.mareyChart.paintMareyChart([], {}, "conditionData")
		//   this.$refs.scatterChart.paintScatter({})
		//   this.$refs.myRiverLikeChart.paint([], '')
		//   this.$refs.outOfGau.paint({}, '')
		//   this.$refs.PCA.paint({}, {}, '')
		//   for (let item of Object.keys(this.processData)) {
		//     this.$refs[item][0].paint([], '')
		//   }

		// },

		// 获取诊断视图数据
		getDiagnosisData(choseUpid, widthGap, lengthGap, thicknessGap,platetype) {
			return baogangPlotAxios('/baogangapi/v1.0/baogangPlot/diagnosesdata', {
				'upid': choseUpid,
				'width': widthGap,
				'length': lengthGap, 
				'thickness': thicknessGap,
				'platetype':JSON.stringify(platetype),
			})
		},

		getDetailProcess(upid, process, width, length, thickness,platetype,deviation) {
					return baogangPlotAxios('/baogangapi/v1.0/model/Visualization', {
					'upid': upid,
					'process':process,
					'width': width,
					'length': length, 
					'thickness': thickness,
					'platetype':JSON.stringify(platetype),
					'deviation':deviation
				}).catch(error=>{
					if(!this.errorflag){
						this.erroralert("缺乏工序数据，请重新选择钢板或工序\n或钢板量少，请修改Tabular Parameters参数")
					}this.errorflag=false
		})
		},
		async getplatetype() {
			return baogangAxios(`/baogangapi/v1.0/model/VisualizationPlatetypes/`).
			then(res=>{
				let data=res.data.flat()
				data.sort()
				this.plateoptions=[]
				this.plateoptions.push({
					value: 'All',
					label: 'All'
				})
				for(let item of data){
							this.plateoptions.push({
							value: item,
							label: item
						})
				}
			})
		},
		async platetype(upid) {
			await this.getplatetype()
			baogangAxios(`/baogangapi/v1.0/model/Platetypes/${upid}/`).
			then(res=>{
				let data=res.data
				// console.log(this.plateoptions)
				for(let i=0;i<this.plateoptions.length;i++){
					if(this.plateoptions[i].value===data){
						this.plateoptions.splice(i, 1);
					}
				}
				this.plateoptions.unshift({
					value: data,
					label: data
				})
			})
		},
		

		paintProcess(value) {
			this.processTurn = value
			this.paintDetailPro(value)
		},
		paintPlate(){
			this.paintDetailPro(this.radio)
		},

		switchSort() {
			this.paintDetailPro(this.radio)
		},

		getJsonData(startDate, endDate) {
			return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoDataDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/50/`)
		 .catch(error => {
				this.erroralert("getJsonData:"+error)
			})
		},

		getStationsData(startDate, endDate) {
			return baogangAxios(`/myf/RollingTimeVisualizationMaretoController/selectRollingTimeVisualizationMaretoStationDto/${startDate}/${endDate}/0/5/all/all/40/40/40/40/all/`)
					.catch(function(error){
						this.erroralert("getStationsData:"+error)
					})
		},
		erroralert(error){
			this.isSearch = false
			this.loadingDataLoading = false
			this.scatterLoading = false
				this.$alert(error, '警告', {
					confirmButtonText: '确定',
					callback: action => {
					}
				});
		},
		switchChange(bool) {
			let selectcolor=this.$refs.mareyChart.setTrainColor(bool)
			console.log(selectcolor)
			if(selectcolor)(this.selectedTrainColor=selectcolor)
			// this.changeScatterColor();
			this.$refs.scatterloging.setTrainColor();
			// // this.selectedTrainColor
			// let seletcolor=this.$refs.mareyChart.setTrainColor(bool) 
			// // this.changeScatterColor();
			// // this.selectedTrainData !== undefined && this.paintUnderCharts(this.selectedTrainData); 
			this.selectedTrainData !== undefined && this.paintSwitchUnderCharts(this.selectedTrainData); 
		},
		async getAlgorithmData() {
			await this.scattlog();
			this.$refs.scatterloging.paintArc([this.startDate, this.endDate])
			this.scatterLoading = false
			this.isSearch = false
		},

		// changeScatterColor() {
		// 		var symbolSizeScaler = d3.scaleLinear()
		// 			.domain([0.006, 0.16])
		// 			.range([6, 12])
		// 		// this.scatterLoading = true
		// 		let tempArray = []
		// 		for (let key in this.scatterResponse.data) {
		// 			tempArray.push(this.scatterResponse.data[key]);
		// 		}

		// 		// let nestedArrayByCategory = d3.nest()
		// 		// 	.key(d => d.productcategory)
		// 		// 	.entries(tempArray);
		// 		// let nestedArrayByCategory=d3.rollup(tempArray, v => v,d => d.productcategory);
		// 		let nestedArrayByCategory=d3.groups(tempArray, d => d.productcategory);
		// 		for (let item in nestedArrayByCategory){
		// 			nestedArrayByCategory[item]={key:nestedArrayByCategory[item][0],values:nestedArrayByCategory[item][1]}
		// 		}
		// 		// console.log(nestedArrayByCategory)
		// 		let seriesDataForLabel = [
		// 			{
		// 				name: '0',
		// 				type: 'scatter',
		// 				data: tempArray.filter(d => d.label === '0').map(v => {
		// 					return {
		// 						value: [v.x, v.y],
		// 						name: v.upid.toString()
		// 					}
		// 				}),
		// 				symbolSize: (data, params) => {
		// 					return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
		// 				},
		// 				itemStyle: {
		// 					color: util.labelColor[0],
		// 				}
		// 			},
		// 			{
		// 				name: '1',
		// 				type: 'scatter',
		// 				data: tempArray.filter(d => d.label === '1').map(v => {
		// 					return {
		// 						value: [v.x, v.y],
		// 						name: v.upid.toString()
		// 					}
		// 				}),
		// 				symbolSize: (data, params) => {
		// 					return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
		// 				},
		// 				itemStyle: {
		// 					color: util.labelColor[1]
		// 				}
		// 			}
		// 		]
		// 		let scatterOption =
		// 		{
		// 			seriesData: this.isSwitch ? seriesDataForLabel : nestedArrayByCategory.map(n => {
		// 				return {
		// 					name: n.key,
		// 					type: 'scatter',
		// 					data: [...n.values].map(v => {
		// 						return {
		// 							value: [v.x, v.y],
		// 							name: v.upid.toString()
		// 						}
		// 					}),
		// 					symbolSize: (data, params) => {
		// 						return symbolSizeScaler(tempArray[params.dataIndex].tgtplatethickness2)
		// 					},
		// 					itemStyle: {
		// 						color: util.categoryColor(n.key)
		// 					}
		// 				}
		// 			}),
		// 			tooltip: {
		// 				formatter: function (params) {
		// 					return "upid:" + tempArray[params.dataIndex].upid + "<br/>"
		// 						+ "category:" + tempArray[params.dataIndex].productcategory + "<br/>"
		// 						+ "time:" + tempArray[params.dataIndex].toc + "<br/>"
		// 						// + "tgtwidth:" + tempArray[params.dataIndex].tgtwidth + "<br/>"
		// 						// + "crowntotal:" + tempArray[params.dataIndex].crowntotal + "<br/>"
		// 						// + "wedgetotal:" + tempArray[params.dataIndex].wedgetotal + "<br/>"
		// 						// + "tgtplatethickness2:" + tempArray[params.dataIndex].tgtplatethickness2 + "<br/>"
		// 						// + "ave_temp_dis:" + tempArray[params.dataIndex].ave_temp_dis + "<br/>"
		// 				}
		// 			},
					
					
		// 		}
		// 		this.myScatterChart = echarts.init(document.getElementById('scatter'))
		// 		this.scatterChange = scatterOption
		// 		var OptionFScatter = {}
		// 		OptionFScatter.series = scatterOption.seriesData;
		// 		OptionFScatter.tooltip = scatterOption.tooltip;
		// 		OptionFScatter.xAxis =  [{
		// 			show: false,
		// 			type: 'value',
		// 			scale: true,
		// 			splitLine: {
		// 				show: true
		// 			},
		// 			axisLabel: {
		// 					show: false
		// 			}
		// 		}]
		// 		OptionFScatter.yAxis = [{
		// 			show: false,
		// 			type: 'value',
		// 			scale: true,
		// 			splitLine: {
		// 				show: true
		// 			},
		// 			axisLabel: {
		// 					show: false
		// 			}
		// 		}]
		// 		this.myScatterChart.setOption(OptionFScatter, true);
		// 		this.scatterLoading = false
		// 		this.isSearch = false
		// }, 

		trainClick(value) {

			this.selectedTrainData = value.list;
			this.selectedTrainColor = value.color;
			// if (this.chooseList.length === 0) {
			// 	// 高亮当前图形
			// 	this.myScatterChart.dispatchAction({
			// 			type: 'highlight',
			// 			name: value.list[value.list.length-1]
			// 	});
			// 	// 显示 tooltip
			// 	this.myScatterChart.dispatchAction({
			// 			type: 'showTip',
			// 			name: value.list[value.list.length-1]
			// 	});
			// }
			// else if (value.list.length < this.chooseList.length) {
			// 	this.myScatterChart.dispatchAction({
			// 			type: 'downplay',
			// 			name: this.chooseList[this.chooseList.length-1]
						
			// 	})
			// } else {
			// 	// 高亮当前图形
			// 	this.myScatterChart.dispatchAction({
			// 			type: 'highlight',
			// 			// seriesIndex: 1,
			// 			name: value.list[value.list.length-1]
			// 	});
			// 	// 显示 tooltip
			// 	this.myScatterChart.dispatchAction({
			// 			type: 'showTip',
			// 			// seriesIndex: 0,
			// 			name: value.list[value.list.length-1]
						
			// 	});
			// }
			this.chooseList = value.list
			this.paintUnderCharts(this.chooseList[0]);
			// plate heat
			// this.selectedTrainData.length > 0 && this.getPlate(this.selectedTrainData.slice(-1)[0]);

			
		},
		trainMouse(value){
			this.$refs.scatterloging.mouse(value)
		},
		paintUnderCharts(upid) {
			// diagnosisData
			this.paintRiverLike();
			this.platetype(this.selectedTrainData[this.selectedTrainData.length-1]);

		},
		paintSwitchUnderCharts(upid){
			this.platetype(this.selectedTrainData[this.selectedTrainData.length-1]);
			let diagnosisData=this.diagnosisData
			let diagnosisSinData = diagnosisData.result
			let diagnosisGauData = diagnosisData.outOfGau
			let diagnosisT2Data = diagnosisData.PCAT2
			let diagnosisSPEData = diagnosisData.PCASPE
			this.$refs.myRiverLikeChart.paint(diagnosisSinData, this.selectedTrainColor, false)
			this.$refs.outOfGau.paint(diagnosisGauData, this.selectedTrainColor, false)
			this.$refs.PCA.paint(diagnosisT2Data, diagnosisSPEData, this.selectedTrainColor)
			this.orderchange()
		},

		async paintSimilarity() {
			let similar = (await baogangAxios(`/baogangapi/v1.0/model/Temperature2DAndFQCpictureSimilarity/${this.selectedTrainData.slice(-1)[0]}/`)).data.Similarity;
			this.$refs.similarGauge.paint(similar);
		},

		async paintRiverLike() {
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}		
			if(query.length===0)query=this.plateTempPropvalue
			let diagnosisData = (await this.getDiagnosisData(this.selectedTrainData[this.selectedTrainData.length-1], this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query)).data
			this.diagnosisData=diagnosisData
			if(diagnosisData["result"].length === 0){
				this.erroralert("钢板数据标签不足")
				return
			}
			await baogangAxios("baogangapi/v1.0/model/VisualizationCorrelation/"+`${util.timeFormat(this.dateselect[0])}/${util.timeFormat(this.dateselect[1])}/`).then(Response => {
				this.$refs.wheelering.paintChart(diagnosisData,Response.data)
				this.$refs.wheeler1.paintChart(diagnosisData,Response.data)
				this.$refs.wheeler2.paintChart(diagnosisData,Response.data)
			})
			this.paintDetailPro(this.processTurn)
		},

		async paintDetailPro(processNumber) {
			this.processInTurn = [null, null]
			let processName = this.processArray[processNumber]||'heat'

			
			let biasData = []
			if(this.selectedTrainData.length===0){
				this.erroralert("未选择具体钢板进行分析，请在马雷图选择钢板")
				return
			}
			if(this.plateTempPropvalue.length===0){
				// this.erroralert("未选择合适的钢板类型进行分析，将默认为你选取所有钢板") 
				this.plateTempPropvalue=['All'];
				this.paintPlate()}
			let query=[]
			for (let item of this.plateTempPropvalue){
				if(item==='All'){
					query.push(item)
				}
			}
			if(query.length===0)query=this.plateTempPropvalue
			let processDetail = (await this.getDetailProcess(this.selectedTrainData[this.selectedTrainData.length-1], processName, this.plateTempProp.width/1000, this.plateTempProp.length, this.plateTempProp.thickness/1000,query,this.plateTempProp.deviation)).data
			// let processDetail = (await this.getDetailProcess('18A15070000', processName, this.plateTempProp.width, this.plateTempProp.length, this.plateTempProp.thickness)).data
			this.processData = processDetail
			this.processName=processName
			// this.processInTurn = Object.keys(processDetail)
			this.orderchange()
		},
		orderchange(){
			this.processInTurn = Object.keys(this.processData)
			if(this.orderselect==='Number'){
				let sortarray=[]
				let sortresult={}
				for(let item in this.processData){
					let length=this.processData[item].min.length
					let errornumber=0
					for (let i=0;i<length;i++){
						if(this.processData[item].min[i]<=this.processData[item].sample[i]&&this.processData[item].sample[i]<=this.processData[item].max[i]){              
						}else{
							errornumber++;
						}
					}
					sortarray.push({'id':errornumber,'name':item})
				}
				sortarray.sort((a,b)=>{
					return b.id-a.id;
				})
				for(let item of sortarray){
					sortresult[item.name]=this.processData[item.name]
				}
				this.processInTurn = Object.keys(sortresult)
			}
			if(this.orderselect==='Deviation'){
				let sortarray=[]
				let sortresult={}
				for(let item in this.processData){
					let length=this.processData[item].min.length
					let errornumber=0
					for (let i=0;i<length;i++){
						if(this.processData[item].min[i]<=this.processData[item].sample[i]&&this.processData[item].sample[i]<=this.processData[item].max[i]){
							
						}else{
							let min=(this.processData[item].min[i]-this.processData[item].sample[i])/Math.abs(this.processData[item].min[i])
							let max=(this.processData[item].sample[i]-this.processData[item].max[i])/Math.abs(this.processData[item].max[i])
							errornumber=Math.max(min,max,errornumber)
						}
					}
					sortarray.push({'id':errornumber,'name':item})
				}
				sortarray.sort((a,b)=>{
					return b.id-a.id;
				})
				for(let item of sortarray){
					sortresult[item.name]=this.processData[item.name]
				}
				this.processInTurn = Object.keys(sortresult)
			}
			this.$nextTick(function() {
				for (let item of this.processInTurn) {
					if (['roll', 'cool'].indexOf(this.processName)) {
							this.$refs[item][0].paint(this.processData[item], ['length', ''], this.selectedTrainColor)
					} else {
							this.$refs[item][0].paint(this.processData[item], ['pass', ''], this.selectedTrainColor)
					}
					
				}
			})
		},
		indicatorChange(value) {
			this.indicators = value;
		},
		async getTimeBrushData() {
			var s1 = this.dateselect[0].getTime(),s2 = this.dateselect[1].getTime();
			var total = (s2 - s1)/1000;
			var day = parseInt(total / (24*60*60));//计算整数天数
			if(day>=30){
				this.$alert('选择超过期限，请重新选择', '警告', {
					confirmButtonText: '确定',
					callback: action => {
					}
				});
				return 
			}
			let startDate=util.timeFormat(this.dateselect[0])
			let endDate=util.timeFormat(this.dateselect[1])
			// let startDate = util.timeFormat(this.monthToShow);
			
			// let end = new Date(this.monthToShow.valueOf());
			// end.setMonth(end.getMonth() + 1)
			// let endDate = util.timeFormat(end);
// .then(Response => {
//       }).catch(function(error) {
//     // 处理 getJSON 和 前一个回调函数运行时发生的错误
//     console.log('发生错误！', error);
//       })
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;
			await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)
			.then(Response => {
				this.timeBrushData=Response.data
					}).catch(function(error) {
				// 处理 getJSON 和 前一个回调函数运行时发生的错误
				console.log('发生错误！', error);
				this.erroralert('时间线渲染错误，请选择合适的时间区间')
					})
			// 时间改为灵活
			// this.timeBrushData = (await baogangAxios(`/baogangapi/v1.0/model/plateYieldStaistics/${this.interval}/${startDate}/${endDate}/`)).data;

			this.isSearch = false 
			let keys = ["endTimeOutput", "good_flag", "bad_flag"]
			this.$refs.timeBrush.paint({
				paintData: this.timeBrushData,
				color: util.labelColor,
				starttime:util.timeFormat(this.startDate)
			});
			this.$refs.scatterloging.paintChart(this.scatterlogdata,[this.startDate, this.endDate])
		},
		async getRadarIndicatorOptions() {
			let startDate = util.timeFormat(this.dateselect[0]);
			// let end = new Date(this.dateselect[0].valueOf());
			// end.setMonth(end.getMonth() + 1)
			// let endDate = util.timeFormat(end)
			let endDate = util.timeFormat(this.dateselect[1])

			await baogangAxios(`baogangapi/v1.0/model/VisualizationCorrelation/${startDate}/${endDate}/`).then(Response => {
				this.forcedata=Response.data
				// this.$refs.force.paint(Response.data)
			})

		},
		day(){
			var now = new Date();
			var year = now.getFullYear(); //得到年份
			var month = now.getMonth();//得到月份
			var date = now.getDate();//得到日期

			let entry=util.timeFormat(this.dateselect[0])
			entry = entry.replace(/-/g,"/");
			
			let dateend = new Date(entry.valueOf());
			dateend.setMonth(month)
			dateend.setDate(1)
			dateend.setYear(year)
			this.dateselect[1].setYear(year)
			this.dateselect[0]=dateend
			var startTime = new Date(this.dateselect[0]).getTime();
			var diff = 45*86400*1000;
			var endTime = startTime + diff;
			var d = new Date(endTime);
			this.dateselect[1]=d
			this.startDate=this.dateselect[0]
			this.endDate=this.dateselect[1]
		},
		processclick(value){
			this.processTurn=value
			let dom=document.getElementsByClassName("heatclass")
			for (let item of dom){
				item.style.border='none'
			}
			let heat=dom[value]
			heat.style.border='solid 1.5px #606266'
			// this.paintProcess(value)
			this.paintRiverLike()
		},
		click(){
			let dom=document.getElementsByClassName("heatclass")
			let heat=dom[0]
			heat.addEventListener("mouseover",()=>{
				this.$refs.force.paintcategory(0)
			})
			heat.addEventListener("mouseout",()=>{
				this.$refs.force.paintreset(0)
			})
			let roll=dom[1]
			roll.addEventListener("mouseover",()=>{
				this.$refs.force.paintcategory(1)
			})
			roll.addEventListener("mouseout",()=>{
				this.$refs.force.paintreset(1)
			})
			let cool=dom[2]
			cool.addEventListener("mouseover",()=>{
				this.$refs.force.paintcategory(2)
			})
			cool.addEventListener("mouseout",()=>{
				this.$refs.force.paintreset(2)
			})
		},
		async scattlog() {
			let startDate = util.timeFormat(this.dateselect[0]);
			let endDate = util.timeFormat(this.dateselect[1])
			await baogangAxios(this.algorithmUrls[this.algorithmSelected]+ `${util.timeFormat(this.dateselect[0])}/${util.timeFormat(this.dateselect[1])}/`).then(Response => {
				this.scatterlogdata=Response.data
				this.$refs.scatterloging.paintChart(this.scatterlogdata)
				this.$refs.scatterloging.paintArc([this.startDate, this.endDate])
			})
			// await	baogangAxios(this.algorithmUrls[this.algorithmSelected]+ `${util.timeFormat(this.startDate)}/${util.timeFormat(this.endDate)}/`).then(Response => {
			// 	this.scatterlogdata=Response.data
			// 	this.$refs.scatterloging.paintChart(Response.data,[this.startDate, this.endDate])
			// 	// this.$refs.scatterloging.paintArc([this.startDate, this.endDate])
			// })

		},
	},
	mounted() {
		// baogangAxios('/baogangapi/v1.0/getFlag/2018-10-15%2000:00:00/2018-10-16%2000:00:00/')
		// this.getRadarIndicatorOptions();
		this.getTimeBrushData();
		// this.click()
		// this.paintDetailPro(2)
		// this.getDetailProcess('18A15070000', 'roll', 0.5, 10, 0.01,['All'])
		// this.platetype('18B09019000')
		this.getplatetype()
		this.scattlog()
	}
	
}
</script>

<style>

</style>
<style lang="scss">
.panel-title {
	margin: 6px;
	font-size: 18px;
	// font-weight: normal !important;
	font-family: DIN !important;
	color: #6d7885;
}

.control-logo {
	height: 36px;
	background: white no-repeat;
	background-image: url('../../assets/images/controls2.png');
	background-size: 9% 56%;
	background-position: left 7% center;
	display: flex;
	align-items: center;
	span {
		margin-left: 20%;
		font-weight: bold;
	}
}
.custom-marey {
	background: #ecf0f1;
	margin: -18px;
	padding: 8px;
	.el-button--danger {
		color: #FFF;
		background-color: #337ab7;
		border-color: #337ab7;
	}
	.el-button--danger:hover {
		color: #FFF;
		background-color: #286090;
		border-color: #286090;
	}
	.el-form-item__label {
			text-align: right;
			float: left;
			font-size: 13px;
			color: #606266;
			line-height: 40px;
			padding: 0 12px 0 0;
			-webkit-box-sizing: border-box;
			box-sizing: border-box;
		.el-switch__label * {
			line-height: 1;
			font-size: 12px;
			display: inline-block;
		}
	}
	.abel .el-form-item__label {
			text-align: right;
			float: left;
			font-size: 13px;
			color: #606266;
			line-height: 40px;
			padding: 0 15px 0 0;
			-webkit-box-sizing: border-box;
			box-sizing: border-box;
		.el-switch__label * {
			line-height: 1;
			font-size: 12px;
			display: inline-block;
		}
	}
	.el-switch__label * {
		font-size: 12px;
		color:#303133;
	}
	.el-table thead {
			display: none;
	}
	.myel-card{
		margin: 2px 5px;
		// padding-top: 2px;
		// border: solid 0.25px #ededed;
		border: solid 0.25px #e0e0e0;
		border-radius: 4px;
		transform: translate(5px, 0px);
		// box-shadow: rgb(148, 148, 148) 2px 2px 2.5px !important;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
		.el-card__header {
			font-family: futura !important;
			// font-family: Calibri;
			background-color: #f7f7f7;
			font-weight: normal;
			text-align: left;
			font-size: 14px;
			color: #6d7885;
			height: 30px;
			padding: 4px 2px 2px 20px;
			border-bottom: solid 0.25px #e0e0e0;
		}
		.el-card__body {
			padding: 1px;
		}
	}
	.myel-swtich{
		float:right;
		padding:4px 25px 0px 0px;
		font-family : DIN;
		.el-switch__label{
			span{
				color: #6d7885;
			}
		}
	}
	.card-select{
		float: right;
		width: 100px;
		margin: -3.5px;
		margin-right: 5%;
		.el-input .el-input__inner{
			font-family : DIN;
			color: #6d7885;
		}
	}

	.el-form-item__label{
		font-family : DIN !important;
		color: #6d7885;
	}
	.fontcolor{
		font-family : DIN !important;
		color: #6d7885;
	}
}

.el-select-dropdown__item span{
		font-family : DIN !important;
		color: #6d7885;
}
.my-card {
	margin: 3px 5px;
	// padding-top: 2px;
	// border: solid 0.25px #ededed;
	border: solid 0.25px #e0e0e0;
	border-radius: 4px;
	transform: translate(5px, 0px);
	box-shadow: rgb(148, 148, 148) 2px 2px 2.5px;
	// .my-card-body{
	// }
	.my-card-title {
		// text-indent:20px;
		font-family: Calibri;
		background-color: #f7f7f7;
		font-weight: bold;
		text-align: left;
		font-size: 14px;
		color: #6d7885;
		height: 30px;
		padding: 4px 2px 2px 20px;
		border-bottom: solid 0.25px #e0e0e0;
	}
}

// .el-card.my-card-body-detail{
//   border: solid #f13615
// }
#imput-line {
	position: relative;
	top: -4px;
}
.el-card__body {
    padding: 8px;
}
.el-switch__core{
    border-color: #dcdfe6!important;
    background-color:rgb(153, 154, 157)!important;
}
.heatclass.heat{
	background-color: #ffffff!important;
	&:hover{
		background-color: #fb8b53!important;
	}
}
.heatclass.cool{
	background-color: #ffffff!important;
	&:hover{
		background-color: #28b2f7!important;
	}		
}
.heatclass.roll{
	background-color: #ffffff!important;
	&:hover{
		background-color:#b4b4b4!important;
	}		
}
.el-select-dropdown__item.selected {
    color: #000000!important;
    font-weight: 700;
}
.el-select .el-input.is-focus .el-input__inner {
    border-color: #000000!important;
}
.el-select .el-input__inner:focus {
    border-color:  #000000!important;
}
.title-background{
	height: 60px;
	// color: #f3f3f3;
	background-color: #f3f3f3;
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.1) !important;
	position: relative;
}
#title-first{
	// margin: 6px;
	// text-align: center;
	// display: block;
	font-size: 19px;
	font-weight: bolder;
	font-family: futura !important;
	color: #2c3e50;
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translateX(-50%) translateY(-50%);
}
</style>

